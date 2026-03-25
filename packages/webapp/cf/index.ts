/// <reference path="./worker.d.ts" />

import '@mantou/gem/helper/ssr-shim';

import { isNotNullish } from 'duoyun-ui/lib/types';
import frontmatter from 'front-matter';

import { gameKindMap, gamePlatformMap, gameSeriesMap } from '../src/enums';
import { GetGames, type GetGamesQuery, type GetGamesQueryVariables } from '../src/generated/guestgraphql';
import enJson from '../src/locales/en/basic.json';
import zhJson from '../src/locales/zh-CN/basic.json';
import type { GameAttributes } from '../src/store';
import { embedding, fetchNesbox, fetchWikiHTML, htmlToMarkdown, stripMarkdown, truncateByBytes } from './utils';

async function transformGame(ai: Ai<AiModels>, games: GetGamesQuery['games']) {
  const gameInfoList = await Promise.all(
    games.map(async (game) => {
      const { attributes, body } = frontmatter<GameAttributes>(game.description);
      if (!game.id || !game.name) throw new Error('invalid game');

      const infoList = [game.name];

      if (game.platform) {
        const label = gamePlatformMap[game.platform];
        infoList.push((zhJson as any)[label], (enJson as any)[label]);
      }
      if (game.kind) {
        const label = gameKindMap[game.kind];
        infoList.push((zhJson as any)[label], (enJson as any)[label]);
      }
      if (game.series) {
        const label = gameSeriesMap[game.series];
        infoList.push((zhJson as any)[label], (enJson as any)[label]);
      }

      infoList.push('\n', stripMarkdown(body));

      if (attributes.ref) {
        try {
          const url = new URL(attributes.ref);
          const html = url.origin.endsWith('.wikipedia.org')
            ? await fetchWikiHTML(url)
            : await (await fetch(url)).text();
          infoList.push('\n', htmlToMarkdown(html));
        } catch (err) {
          console.info(err);
        }
      }

      const text = infoList.filter(isNotNullish).join(' ');

      return { id: game.id.toString(), text, metadata: { text: truncateByBytes(text) } };
    }),
  );
  const embeddingList = await embedding(
    ai,
    gameInfoList.map((item) => item.text),
  );
  return gameInfoList.map((item, index) => ({ ...item, values: embeddingList[index] }));
}

const resInit = {
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
};

export default {
  async fetch(req, env, _ctx): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...resInit.headers,
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const url = new URL(req.url);
    const params = new URLSearchParams(url.search);

    switch (url.pathname) {
      case '/sync': {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();
        const log = async (message: object) => {
          return writer.write(encoder.encode(`${JSON.stringify(message)}\n`));
        };
        (async () => {
          try {
            await log({ status: 'start' });
            const { data } = await fetchNesbox<GetGamesQuery, GetGamesQueryVariables>(GetGames, {});
            await log({ status: 'info', total: data.games.length });
            await env.GAMES_SEARCH.upsert(await transformGame(env.AI, data.games));
            await log({ status: 'done' });
          } catch (e: any) {
            await log({ status: 'fatal', message: e.message });
          } finally {
            await writer.close();
          }
        })();

        return new Response(readable, {
          headers: { ...resInit.headers, 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
      case '/update': {
        await env.GAMES_SEARCH.upsert(
          await transformGame(env.AI, [
            req.method === 'POST' ? await req.json() : (Object.fromEntries(params.entries()) as any),
          ]),
        );
        return new Response('Complete', resInit);
      }
      case '/search': {
        const cacheRes = await env.KV.get(req.url);
        if (cacheRes) return new Response(cacheRes, resInit);

        const q = params.get('q') || 'all';
        const [values] = await embedding(env.AI, [q]);
        const res = await env.GAMES_SEARCH.query(values);
        await env.KV.put(req.url, JSON.stringify(res), { expirationTtl: 60 * 60 });
        return Response.json(res, resInit);
      }
      case '/completions': {
        const cacheRes = await env.KV.get(req.url);
        if (cacheRes) return new Response(cacheRes, resInit);

        const q = params.get('q') || '';
        const [values] = await embedding(env.AI, [q]);
        const res = await env.GAMES_SEARCH.query(values, { returnMetadata: true });
        const messages = [
          {
            role: 'system',
            content: `You are an application assistant and need to answer user questions in the target language(${req.headers.get('Accept-Language') ?? 'en'}) according to the following requirements::
                      ${res.matches.map((e) => (e.metadata as any).text).join('\n\n\n')}`,
          },
          {
            role: 'user',
            content: params.get('q') || '',
          },
        ];
        const result = await env.AI.run('@cf/nvidia/nemotron-3-120b-a12b' as any, { messages });
        const body = { content: result?.choices?.at?.(0)?.message?.content };
        await env.KV.put(req.url, JSON.stringify(body), { expirationTtl: 60 * 60 });
        return Response.json(body, resInit);
      }
      default: {
        return new Response('Hello World!');
      }
    }
  },
} satisfies ExportedHandler<Env>;

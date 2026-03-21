/// <reference path="./worker.d.ts" />

import '@mantou/gem/helper/ssr-shim';

import { isNotNullish } from 'duoyun-ui/lib/types';

import { gameKindMap, gamePlatformMap, gameSeriesMap } from '../src/enums';
import { GetGames, type GetGamesQuery, type GetGamesQueryVariables } from '../src/generated/guestgraphql';
import enJson from '../src/locales/en/basic.json';
import zhJson from '../src/locales/zh-CN/basic.json';

async function request<Result, InputVar>(query: string, variables: InputVar) {
  const res = await fetch(`https://api.xianqiao.wang/nesbox/guestgraphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  return res.json<{ data: Result }>();
}

async function embedding(ai: Ai<AiModels>, text: string[]) {
  const embeddingResponse = await ai.run('@cf/baai/bge-small-en-v1.5', { text });
  return (embeddingResponse as any).data as VectorFloatArray[];
}

async function transformGame(ai: Ai<AiModels>, games: GetGamesQuery['games']) {
  const gameInfoList = games.map((game) => {
    if (!game.id || !game.name) throw new Error('invalid game');

    const infoList = [game.name, game.description];
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

    return {
      id: game.id.toString(),
      info: infoList.filter(isNotNullish).join(' '),
      metadata: game,
    };
  });
  const embeddingList = await embedding(ai, gameInfoList.map((item) => item.info));
  return gameInfoList.map((item, index) => ({...item, values: embeddingList[index]}))
}

export default {
  async fetch(req, env, _ctx): Promise<Response> {
    const url = new URL(req.url);
    const params = new URLSearchParams(url.search);

    if (url.pathname === '/sync') {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();
      const log = async (message: object) => {
        return writer.write(encoder.encode(`${JSON.stringify(message)}\n`));
      };
      (async () => {
        try {
          await log({ status: 'start' });
          const { data } = await request<GetGamesQuery, GetGamesQueryVariables>(GetGames, {});
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
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (url.pathname === '/update') {
      const game = Object.fromEntries(params.entries());
      await env.GAMES_SEARCH.upsert(await transformGame(env.AI, [game as any]));
      return new Response('Complete');
    }

    if (url.pathname === '/search') {
      const q = params.get('q') || 'all';
      const [values] = await embedding(env.AI, [q]);
      const res = await env.GAMES_SEARCH.query(values);
      return Response.json(res);
    }

    return new Response('Hello World!!!');
  },
} satisfies ExportedHandler<Env>;

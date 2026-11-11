/// <reference path="./worker.d.ts" />

import '@mantou/gem/helper/ssr-shim';

import { isNotNullish } from 'duoyun-ui/lib/types';
import frontmatter from 'front-matter';

import { gameKindMap, gamePlatformMap, gameSeriesMap } from '../src/enums';
import { GetGames, type GetGamesQuery, type GetGamesQueryVariables } from '../src/generated/guestgraphql';
import enJson from '../src/locales/en/basic.json';
import zhJson from '../src/locales/zh-CN/basic.json';
import type { GameAttributes } from '../src/store';
import {
  type Bm25Index,
  bm25AddDocs,
  bm25RemoveGames,
  bm25Search,
  chunkText,
  embedding,
  fetchNesbox,
  fetchWikiHTML,
  htmlToMarkdown,
  MAX_CHUNKS_PER_GAME,
  rerank,
  rrf,
  stripMarkdown,
  truncateByBytes,
} from './utils';

declare global {
  namespace Cloudflare {
    interface Env {
      // `/sync`、`/update` 的鉴权 token，用 `wrangler secret put AI_SEARCH_TOKEN` 设置
      AI_SEARCH_TOKEN?: string;
    }
  }
}

type ChunkMetadata = { gameId: string; chunk: number; text: string };

// Vectorize Workers binding 单次 upsert 上限 1000
const UPSERT_BATCH_SIZE = 500;
// 向量召回数量（开启 rerank 时作为精排的候选集）
const RECALL_TOP_K = 20;
// 问答时拼入上下文的块数
const CONTEXT_TOP_N = 5;

// 前端筛选把这些类型合并了，`gameKindMap` 里没有，检索时仍需要它们的语义标签
const extraKindLabels: Partial<Record<string, string[]>> = {
  RCG: ['赛车竞速', 'Racing'],
  PZG: ['益智解谜', 'Puzzle'],
  TBS: ['回合制策略', 'Turn-based Strategy'],
  SLG: ['策略模拟', 'Simulation Strategy'],
  TBG: ['桌游', 'Board Game'],
};

const chunkCountKey = (gameId: string) => `chunks:${gameId}`;
const BM25_INDEX_KEY = 'bm25:index';

async function transformGame(ai: Ai<AiModels>, games: GetGamesQuery['games']) {
  const gameChunkList = await Promise.all(
    games.map(async (game) => {
      const { attributes, body } = frontmatter<GameAttributes>(game.description);
      if (!game.id || !game.name) throw new Error('invalid game');

      // 每个块都带上游戏名和标签，保证单独检索到某一块时仍知道属于哪个游戏
      const headerList = [game.name];
      if (game.platform) {
        const label = gamePlatformMap[game.platform];
        headerList.push((zhJson as any)[label], (enJson as any)[label]);
      }
      if (game.kind) {
        // `gameKindMap` 是 Proxy，缺失的 key 会原样返回 key，所以先查 `extraKindLabels`
        const extra = extraKindLabels[game.kind];
        const label = gameKindMap[game.kind];
        headerList.push(...(extra || [(zhJson as any)[label], (enJson as any)[label]]));
      }
      if (game.series) {
        const label = gameSeriesMap[game.series];
        headerList.push((zhJson as any)[label], (enJson as any)[label]);
      }
      const header = headerList.filter(isNotNullish).join(' ');

      const contentList = [stripMarkdown(body)];
      if (attributes.ref) {
        try {
          const url = new URL(attributes.ref);
          const html = url.origin.endsWith('.wikipedia.org')
            ? await fetchWikiHTML(url)
            : await (await fetch(url)).text();
          contentList.push(htmlToMarkdown(html));
        } catch (err) {
          console.info(err);
        }
      }

      const chunks = chunkText(contentList.join('\n')).slice(0, MAX_CHUNKS_PER_GAME);
      const gameId = game.id.toString();
      return (chunks.length ? chunks : ['']).map((chunk, index) => {
        const text = chunk ? `${header}\n${chunk}` : header;
        const metadata: ChunkMetadata = { gameId, chunk: index, text: truncateByBytes(text, 8000) };
        return { id: `${gameId}#${index}`, text, metadata };
      });
    }),
  );

  const chunkList = gameChunkList.flat();
  const embeddingList = await embedding(
    ai,
    chunkList.map((item) => item.text),
  );
  return chunkList.map(({ id, metadata }, index) => ({ id, metadata, values: embeddingList[index] }));
}

async function upsertGames(
  env: Env,
  games: GetGamesQuery['games'],
  { full = false, log }: { full?: boolean; log?: (message: object) => Promise<void> } = {},
) {
  const vectors = await transformGame(env.AI, games);
  await log?.({ status: 'info', chunks: vectors.length });

  // BM25 索引：全量同步时重建，单条更新时替换该游戏的块
  const bm25Index: Bm25Index = (!full && (await env.KV.get<Bm25Index>(BM25_INDEX_KEY, 'json'))) || {
    docs: {},
    terms: {},
  };
  bm25RemoveGames(bm25Index, new Set(vectors.map(({ metadata }) => metadata.gameId)));
  bm25AddDocs(
    bm25Index,
    vectors.map(({ id, metadata }) => ({ id, gameId: metadata.gameId, text: metadata.text })),
  );
  await env.KV.put(BM25_INDEX_KEY, JSON.stringify(bm25Index));
  await log?.({ status: 'info', terms: Object.keys(bm25Index.terms).length });

  for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
    await env.GAMES_SEARCH.upsert(vectors.slice(i, i + UPSERT_BATCH_SIZE));
  }

  // 块数变少时删除多出来的旧块
  const countMap = new Map<string, number>();
  vectors.forEach(({ metadata }) => countMap.set(metadata.gameId, (countMap.get(metadata.gameId) || 0) + 1));
  for (const [gameId, count] of countMap) {
    const oldCount = Number((await env.KV.get(chunkCountKey(gameId))) || 0);
    if (oldCount > count) {
      const staleIds = Array.from({ length: oldCount - count }, (_, i) => `${gameId}#${count + i}`);
      await env.GAMES_SEARCH.deleteByIds(staleIds);
    }
    if (oldCount !== count) await env.KV.put(chunkCountKey(gameId), String(count));
  }
}

type RetrieveMode = 'hybrid' | 'vector' | 'bm25';

/**
 * 混合检索：向量和 BM25 各召回 RECALL_TOP_K 块，用 RRF 融合，返回前 topN 块
 *
 * `mode` 可只用其中一路，用于对比效果。
 * `useRerank` 时再用 bge-reranker-base 精排。默认关闭：
 * 在本项目的中英日混合数据上，它的排序比 bge-m3 的向量相似度差
 */
async function retrieve(
  env: Env,
  query: string,
  topN: number,
  { mode = 'hybrid', useRerank = false }: { mode?: RetrieveMode; useRerank?: boolean } = {},
) {
  const [vectorMatches, bm25Matches] = await Promise.all([
    mode === 'bm25'
      ? []
      : embedding(env.AI, [query]).then(
          async ([values]) =>
            (await env.GAMES_SEARCH.query(values, { topK: RECALL_TOP_K, returnMetadata: 'all' })).matches,
        ),
    mode === 'vector'
      ? []
      : env.KV.get<Bm25Index>(BM25_INDEX_KEY, 'json').then((index) =>
          index ? bm25Search(index, query, RECALL_TOP_K) : [],
        ),
  ]);

  const fused = rrf([vectorMatches.map((e) => e.id), bm25Matches.map((e) => e.id)]);
  // 只被 BM25 命中的块需要再取一次元数据
  const metadataMap = new Map(vectorMatches.map((e) => [e.id, e.metadata as ChunkMetadata | undefined]));
  const missingIds = fused.map((e) => e.id).filter((id) => !metadataMap.has(id));
  if (missingIds.length) {
    (await env.GAMES_SEARCH.getByIds(missingIds)).forEach((e) =>
      metadataMap.set(e.id, e.metadata as ChunkMetadata | undefined),
    );
  }
  const candidates = fused
    .map(({ id, score }) => ({ metadata: metadataMap.get(id), score }))
    .filter((e): e is { metadata: ChunkMetadata; score: number } => !!e.metadata?.text);

  if (!useRerank) {
    return candidates.slice(0, topN).map((e) => ({ ...e.metadata, score: e.score }));
  }
  const ranked = await rerank(
    env.AI,
    query,
    candidates.map((e) => (e.metadata as ChunkMetadata).text),
    topN,
  );
  return ranked.map(({ index, score }) => ({
    ...(candidates[index].metadata as ChunkMetadata),
    score,
  }));
}

const resInit = {
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': 'true',
  },
};

export default {
  async fetch(req, env, ctx): Promise<Response> {
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
    // `rerank=1` 开启精排，用于对比效果；参数在 URL 里，KV 缓存会分开存
    const useRerank = params.get('rerank') === '1';
    // `mode=vector|bm25` 只用其中一路检索，用于对比效果，默认混合
    const mode = (params.get('mode') || 'hybrid') as RetrieveMode;

    // 写入接口需要鉴权：`Authorization: Bearer <token>` 或 `?token=<token>`（方便手动调用）；未配置 token 时一律拒绝
    const token = req.headers.get('Authorization')?.replace(/^Bearer /, '') || params.get('token');
    if (
      (url.pathname === '/sync' || url.pathname === '/update') &&
      (!env.AI_SEARCH_TOKEN || token !== env.AI_SEARCH_TOKEN)
    ) {
      return new Response('Unauthorized', { ...resInit, status: 401 });
    }

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
            await upsertGames(env, data.games, { full: true, log });
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
        await upsertGames(env, [
          req.method === 'POST' ? await req.json() : (Object.fromEntries(params.entries()) as any),
        ]);
        return new Response('Complete', resInit);
      }
      case '/search': {
        const cacheRes = await env.KV.get(req.url);
        if (cacheRes) return new Response(cacheRes, resInit);

        const q = params.get('q') || 'all';
        // 一个游戏可能命中多个块，按游戏去重，保持 `{ matches: { id, score }[] }` 格式（id 为游戏 id）
        const seen = new Set<string>();
        const matches = (await retrieve(env, q, RECALL_TOP_K, { mode, useRerank }))
          .filter(({ gameId }) => !seen.has(gameId) && seen.add(gameId))
          .map(({ gameId, score }) => ({ id: gameId, score }));
        const res = { matches, count: matches.length };
        await env.KV.put(req.url, JSON.stringify(res), { expirationTtl: 60 * 60 });
        return Response.json(res, resInit);
      }
      case '/completions': {
        const cacheRes = await env.KV.get(req.url);
        if (cacheRes) {
          return new Response(cacheRes, {
            headers: { ...resInit.headers, 'Content-Type': 'text/event-stream; charset=utf-8' },
          });
        }
        const q = params.get('q') || '';
        const l = params.get('l') || req.headers.get('Accept-Language') || 'en';
        const chunks = await retrieve(env, q, CONTEXT_TOP_N, { mode, useRerank });
        const messages = [
          {
            role: 'system',
            content: `You are an application assistant.

Requirements:
1. Respond briefly to user input based on context.
2. Language: respond in (${l}).

Context:
${chunks.map((e) => e.text).join('\n\n---\n\n')}
`,
          },
          {
            role: 'user',
            content: params.get('q') || '',
          },
        ];
        const stream = await env.AI.run('@cf/nvidia/nemotron-3-120b-a12b' as any, { messages, stream: true });
        const [stream1, stream2] = stream.tee();

        ctx.waitUntil(
          new Response(stream1).text().then((text) => env.KV.put(req.url, text, { expirationTtl: 60 * 60 })),
        );

        return new Response(stream2, {
          headers: { ...resInit.headers, 'Content-Type': 'text/event-stream; charset=utf-8' },
        });
      }
      default: {
        return new Response('Hello World!');
      }
    }
  },
} satisfies ExportedHandler<Env>;

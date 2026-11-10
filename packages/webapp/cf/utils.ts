import { NodeHtmlMarkdown } from 'node-html-markdown';

// 多语言 embedding（中英混合），1024 维，需配合 1024 维的 Vectorize 索引
export const EMBEDDING_MODEL = '@cf/baai/bge-m3';
export const RERANK_MODEL = '@cf/baai/bge-reranker-base';

// 分块参数：bge-reranker-base 单次最多 512 token，块不宜过长
const CHUNK_MAX_CHARS = 800;
const CHUNK_OVERLAP_CHARS = 100;
// 单个游戏最多的块数，限制长维基页面带来的推理成本
export const MAX_CHUNKS_PER_GAME = 24;
// 单次 embedding 请求的文本数
const EMBEDDING_BATCH_SIZE = 50;

export function truncateByBytes(str = '', maxBytes = 10000) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: false });
  const buf = encoder.encode(str);
  if (buf.length <= maxBytes) return str;
  const slicedBuf = buf.subarray(0, maxBytes);
  return decoder.decode(slicedBuf).replace(/\uFFFD/g, '');
}

export async function fetchNesbox<Result, InputVar>(query: string, variables: InputVar) {
  const res = await fetch(`https://api.xianqiao.wang/nesbox/guestgraphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  return res.json<{ data: Result }>();
}

export async function embedding(ai: Ai<AiModels>, text: string[]) {
  const result: VectorFloatArray[] = [];
  for (let i = 0; i < text.length; i += EMBEDDING_BATCH_SIZE) {
    const res = await ai.run(EMBEDDING_MODEL, {
      text: text.slice(i, i + EMBEDDING_BATCH_SIZE),
      truncate_inputs: true,
    });
    result.push(...((res as any).data as VectorFloatArray[]));
  }
  return result;
}

/**
 * 用 cross-encoder 对候选文本重新打分，返回按分数降序的 `{ index, score }`
 */
export async function rerank(ai: Ai<AiModels>, query: string, texts: string[], topK: number) {
  if (!texts.length) return [];
  const res = await ai.run(RERANK_MODEL, {
    // 类型定义里漏了 query 字段，实际 API 需要
    query,
    top_k: topK,
    contexts: texts.map((text) => ({ text })),
  } as Ai_Cf_Baai_Bge_Reranker_Base_Input);
  return (res.response || [])
    .filter((e) => e.id !== undefined)
    .map((e) => ({ index: e.id!, score: e.score ?? 0 }))
    .sort((a, b) => b.score - a.score);
}

// ICU 分词/分句，同一个实例可同时处理中日英混排文本
const sentenceSegmenter = new Intl.Segmenter('zh', { granularity: 'sentence' });
const wordSegmenter = new Intl.Segmenter('zh', { granularity: 'word' });

/**
 * 按段落 → 句子切分，再合并成不超过 maxChars 的块，相邻块重叠末尾不超过 overlap 字符的整句
 */
export function chunkText(text: string, maxChars = CHUNK_MAX_CHARS, overlap = CHUNK_OVERLAP_CHARS) {
  const sentences = text
    .split(/\n+/)
    .flatMap((p) => Array.from(sentenceSegmenter.segment(p), (s) => s.segment.trim()))
    .filter(Boolean)
    // 单句超长时硬切
    .flatMap((s) =>
      Array.from({ length: Math.ceil(s.length / maxChars) }, (_, i) => s.slice(i * maxChars, (i + 1) * maxChars)),
    );

  const chunks: string[] = [];
  let current: string[] = [];
  let size = 0;
  for (const s of sentences) {
    if (size && size + s.length > maxChars) {
      chunks.push(current.join(' '));
      const tail: string[] = [];
      for (let i = current.length - 1, n = 0; i >= 0 && n + current[i].length <= overlap; i--) {
        tail.unshift(current[i]);
        n += current[i].length;
      }
      current = tail;
      size = tail.reduce((n, t) => n + t.length, 0);
    }
    current.push(s);
    size += s.length;
  }
  if (current.length) chunks.push(current.join(' '));
  return chunks;
}

/**
 * 分词，用于 BM25；英文转小写，去掉标点
 */
export function tokenize(text: string) {
  return Array.from(wordSegmenter.segment(text.toLowerCase()))
    .filter((s) => s.isWordLike)
    .map((s) => s.segment);
}

/**
 * BM25 倒排索引，整体存一个 KV 值
 */
export type Bm25Index = {
  // 块 id → 所属游戏和词数
  docs: Record<string, { gameId: string; len: number }>;
  // 词 → { 块 id: 词频 }
  terms: Record<string, Record<string, number>>;
};

export function bm25AddDocs(index: Bm25Index, docs: { id: string; gameId: string; text: string }[]) {
  for (const { id, gameId, text } of docs) {
    const tokens = tokenize(text);
    index.docs[id] = { gameId, len: tokens.length };
    for (const t of tokens) (index.terms[t] ||= {})[id] = (index.terms[t][id] || 0) + 1;
  }
}

export function bm25RemoveGames(index: Bm25Index, gameIds: Set<string>) {
  const ids = new Set(Object.keys(index.docs).filter((id) => gameIds.has(index.docs[id].gameId)));
  if (!ids.size) return;
  ids.forEach((id) => delete index.docs[id]);
  for (const [t, postings] of Object.entries(index.terms)) {
    ids.forEach((id) => delete postings[id]);
    if (!Object.keys(postings).length) delete index.terms[t];
  }
}

/**
 * 返回按 BM25 分数降序的 `{ id, score }`
 */
export function bm25Search(index: Bm25Index, query: string, topK: number, k1 = 1.2, b = 0.75) {
  const docIds = Object.keys(index.docs);
  const N = docIds.length;
  if (!N) return [];
  const avgLen = docIds.reduce((n, id) => n + index.docs[id].len, 0) / N;
  const scores = new Map<string, number>();
  for (const t of new Set(tokenize(query))) {
    const postings = index.terms[t];
    if (!postings) continue;
    const df = Object.keys(postings).length;
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    for (const [id, tf] of Object.entries(postings)) {
      const norm = tf + k1 * (1 - b + (b * index.docs[id].len) / avgLen);
      scores.set(id, (scores.get(id) || 0) + (idf * tf * (k1 + 1)) / norm);
    }
  }
  return [...scores]
    .sort((x, y) => y[1] - x[1])
    .slice(0, topK)
    .map(([id, score]) => ({ id, score }));
}

/**
 * Reciprocal Rank Fusion：按名次融合多路结果，不依赖各路分数的量纲
 */
export function rrf(lists: string[][], k = 60) {
  const scores = new Map<string, number>();
  for (const list of lists) list.forEach((id, i) => scores.set(id, (scores.get(id) || 0) + 1 / (k + i + 1)));
  return [...scores].sort((x, y) => y[1] - x[1]).map(([id, score]) => ({ id, score }));
}

export async function fetchWikiHTML(url: URL) {
  const page = decodeURIComponent(String(url.pathname.split('/').pop()));
  const params = new URLSearchParams({ action: 'parse', prop: 'text', format: 'json', page });
  const res = await fetch(`${url.origin}/w/api.php?${params}`, {
    headers: {
      'User-Agent': 'NESBox/1.0 (https://nesbox.xianqiao.wang; 594mantou@gmail.com)',
    },
  });
  const data = await res.json();
  return (data as any).parse.text['*'];
}

export function htmlToMarkdown(html: string) {
  return NodeHtmlMarkdown.translate(
    html,
    {
      emDelimiter: '',
      strongDelimiter: '*',
      maxConsecutiveNewlines: 1,
      ignore: ['img', 'video', 'audio', 'iframe'],
      keepDataImages: false,
    },
    {
      a: ({ node }) => ({ content: node.textContent || '' }),
      table: ({ node }) => ({ content: node.textContent || '' }),
      img: () => ({ content: '' }),
      video: () => ({ content: '' }),
      audio: () => ({ content: '' }),
      iframe: () => ({ content: '' }),
    },
  );
}

export function stripMarkdown(md: string) {
  return (
    md
      // 1. 去掉图片 ![alt](url)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      // 2. 链接 [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  );
}

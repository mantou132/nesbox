import { NodeHtmlMarkdown } from 'node-html-markdown';

export function getFrontmatter(md = '') {
  const [, frontmatter = ''] = md.match(/^---\n([\s\S]*?)\n---/) || [];
  return Object.fromEntries(
    frontmatter
      .split(/\n+/)
      .filter(Boolean)
      .map((s) => {
        const [key, ...rest] = s.split(':');
        return [key.trim(), rest.join(':').trim()];
      }),
  );
}

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
  const embeddingResponse = await ai.run('@cf/baai/bge-small-en-v1.5', { text });
  return (embeddingResponse as any).data as VectorFloatArray[];
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

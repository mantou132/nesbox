export const normalizeFilename = (filename: string) =>
  filename
    .split(/\.|,/)[0]
    .replace(/^./, (e) => e.toLowerCase())
    .replace(/[^a-zA-Z](.)/g, (_, char) => char.toUpperCase());

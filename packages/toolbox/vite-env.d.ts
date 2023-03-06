/// <reference types="vite/client" />

declare module 'qoijs' {
  const qoi: any;
  export default qoi;
}

interface FontMetadata {
  family: string;
  fullName: string;
  postscriptName: string;
}

interface Window {
  queryLocalFonts: () => Promise<FontMetadata[]>;
}

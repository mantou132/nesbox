/// <reference types="vite/client" />
interface FontMetadata {
  family: string;
  fullName: string;
  postscriptName: string;
}

interface Window {
  queryLocalFonts: () => Promise<FontMetadata[]>;
}

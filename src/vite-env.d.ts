/// <reference types="vite/client" />

// vite-imagetools types
declare module '*?format=webp&quality=85' {
  const src: string;
  export default src;
}

declare module '*?format=webp&quality=80' {
  const src: string;
  export default src;
}

declare module '*?optimized' {
  const src: string;
  export default src;
}

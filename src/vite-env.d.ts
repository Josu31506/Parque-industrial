/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.jpeg';
declare module '*.jpg';
declare module '*.png';
declare module '*.svg';

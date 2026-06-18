/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.jpeg';
declare module '*.jpg';
declare module '*.png';
declare module '*.svg';

declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
      src?: string;
      alt?: string;
      'camera-controls'?: boolean | string;
      'auto-rotate'?: boolean | string;
      'shadow-intensity'?: string;
      exposure?: string;
      loading?: 'auto' | 'lazy' | 'eager';
      reveal?: 'auto' | 'interaction' | 'manual';
      'camera-orbit'?: string;
      'min-camera-orbit'?: string;
      'max-camera-orbit'?: string;
      'field-of-view'?: string;
      ar?: boolean | string;
    };
  }
}

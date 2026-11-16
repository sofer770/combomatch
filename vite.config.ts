import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import type { Plugin } from 'vite';

// Home-screen install (PWA) tags, only for the hosted build. The single file stays self-contained.
const pwaTags = (): Plugin => ({
  name: 'pwa-tags',
  transformIndexHtml: () => [
    { tag: 'link', attrs: { rel: 'manifest', href: './manifest.webmanifest' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'theme-color', content: '#3d7d46' }, injectTo: 'head' },
    { tag: 'link', attrs: { rel: 'apple-touch-icon', href: './icons/apple-touch-icon.png' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'apple-mobile-web-app-capable', content: 'yes' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'mobile-web-app-capable', content: 'yes' }, injectTo: 'head' },
    { tag: 'meta', attrs: { name: 'apple-mobile-web-app-title', content: 'ComboMatch' }, injectTo: 'head' },
  ],
});

// "single" mode builds one self-contained HTML file (handy for sharing/hosting anywhere).
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [pwaTags()])],
  // public/ (manifest, icons, service worker) belongs to the hosted build only
  publicDir: mode === 'single' ? false : 'public',
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
  test: { environment: 'jsdom', globals: false },
}));

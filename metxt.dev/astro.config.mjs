// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://metxt.dev',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()]
  }
});

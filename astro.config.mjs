// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://pugdb.github.io',
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      customPages: ['https://pugdb.github.io/showcase/'],
      serialize(item) {
        return {
          ...item,
          lastmod: new Date().toISOString(),
        };
      },
    }),
  ],
});

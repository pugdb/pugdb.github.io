// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://pugdb.github.io',
  // No base path needed - repository should be named 'pugdb.github.io' for root domain
  integrations: [tailwind()],
});

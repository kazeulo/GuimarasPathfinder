import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  // lets tests mount components in a browser-like environment
  resolve: process.env.VITEST ? { conditions: ['browser'] } : undefined,
})

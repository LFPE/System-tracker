import { defineConfig } from 'vite'
import pages from '@hono/vite-cloudflare-pages'

export default defineConfig({
  publicDir: 'frontend/public',
  plugins: [
    pages({
      entry: 'backend/src/app.ts'
    })
  ],
  build: {
    outDir: 'dist'
  }
})

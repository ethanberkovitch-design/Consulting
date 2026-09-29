import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Relative base so the build runs from any path (Cerevision, GitHub Pages, a subfolder).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})

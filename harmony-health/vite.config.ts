import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/harmony-health/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // React, React-DOM and lucide-react are loaded from esm.sh via an import
      // map in index.html, keeping this bundle to the app code alone.
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', 'lucide-react'],
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        manualChunks(id) {
          // Split per-screen so each file stays small — helps Cerevision
          // uploads (< 256KB) and keeps first paint fast on the dashboard.
          if (id.includes('/src/components/Onboarding')) return 'chunk-onboarding'
          if (id.includes('/src/components/Dashboard')) return 'chunk-dashboard'
          if (id.includes('/src/components/FoodDiary')) return 'chunk-diary'
          if (id.includes('/src/components/MealPlan')) return 'chunk-plan'
          if (id.includes('/src/components/WeightTracker')) return 'chunk-weight'
          if (id.includes('/src/components/Workouts')) return 'chunk-workouts'
          if (id.includes('/src/components/Habits')) return 'chunk-habits'
          if (id.includes('/src/components/MethodPage')) return 'chunk-method'
          if (id.includes('/src/components/ProfilePage')) return 'chunk-profile'
          if (id.includes('/src/components/Mindfulness')) return 'chunk-mindful'
          if (id.includes('/src/components/Tips')) return 'chunk-tips'
          if (id.includes('/src/data/')) return 'chunk-data'
          return undefined
        },
      },
    },
  },
})

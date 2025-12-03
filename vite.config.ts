import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@store': path.resolve(__dirname, 'src/store'),
      '@domain': path.resolve(__dirname, 'src/engines'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@windows': path.resolve(__dirname, 'src/components/windows'),
      '@panels': path.resolve(__dirname, 'src/components/windows'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@three': path.resolve(__dirname, 'src/shared/three'),
      '@pages': path.resolve(__dirname, 'src/pages'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
})

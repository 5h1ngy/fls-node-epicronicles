import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, 'env'), '')
  const base = env.VITE_BASE_PATH || '/'

  return {
    // Base path configurable via env; defaults to root in dev, repo path in prod.
    base,
    envDir: path.resolve(__dirname, 'env'),
    plugins: [react()],
    resolve: {
      alias: {
        '@store': path.resolve(__dirname, 'src/store'),
        '@domain': path.resolve(__dirname, 'src/engines'),
        '@components': path.resolve(__dirname, 'src/ui/views'),
        '@windows': path.resolve(__dirname, 'src/ui/windows'),
        '@panels': path.resolve(__dirname, 'src/ui/panels'),
        '@hud': path.resolve(__dirname, 'src/ui/hud'),
        '@docks': path.resolve(__dirname, 'src/ui/docks'),
        '@hooks': path.resolve(__dirname, 'src/hooks'),
        '@shared': path.resolve(__dirname, 'src/shared'),
        '@config': path.resolve(__dirname, 'src/config'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@three': path.resolve(__dirname, 'src/shared/three'),
        '@pages': path.resolve(__dirname, 'src/ui/pages'),
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
  }
})

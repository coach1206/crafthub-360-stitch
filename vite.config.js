import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const commitSha = process.env.VERCEL_GIT_COMMIT_SHA
  || (() => { try { return execSync('git rev-parse HEAD').toString().trim() } catch { return 'local' } })()
const commitBranch = process.env.VERCEL_GIT_COMMIT_REF
  || (() => { try { return execSync('git rev-parse --abbrev-ref HEAD').toString().trim() } catch { return 'local' } })()

export default defineConfig({
  define: {
    __BUILD_COMMIT__: JSON.stringify(commitSha),
    __BUILD_BRANCH__: JSON.stringify(commitBranch),
    __BUILD_TIME__:   JSON.stringify(new Date().toISOString()),
  },
  plugins: [react()],
  server: {
    host:         '0.0.0.0',
    port:         5000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target:       'http://localhost:3001',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
    ],
  },
})

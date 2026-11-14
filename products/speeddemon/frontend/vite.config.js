import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  // Base path for GitHub Pages
  // For project pages: /repo-name/ (lowercase, matches GitHub URL)
  // For user/org pages (username.github.io): '/'
  let basePath = '/'
  
  // Check if this is a production build (either mode is 'production' OR command is 'build' with NODE_ENV=production)
  const isProductionBuild = mode === 'production' || (command === 'build' && process.env.NODE_ENV === 'production')
  
  if (isProductionBuild) {
    if (process.env.GITHUB_REPOSITORY) {
      // Extract repo name from "owner/repo-name" and convert to lowercase
      const repoName = process.env.GITHUB_REPOSITORY.split('/').pop()?.toLowerCase() || 'speeddemon'
      basePath = `/${repoName}/`
      console.log(`[Vite Config] Production build detected. Repository: ${process.env.GITHUB_REPOSITORY}`)
      console.log(`[Vite Config] Setting base path to: ${basePath}`)
    } else {
      // Default fallback (should match your actual repo name)
      basePath = '/speeddemon/'
      console.log(`[Vite Config] No GITHUB_REPOSITORY env var found. Using default base path: ${basePath}`)
      console.log(`[Vite Config] Mode: ${mode}, Command: ${command}, NODE_ENV: ${process.env.NODE_ENV}`)
    }
  } else {
    console.log(`[Vite Config] Development mode. Using base path: ${basePath}`)
  }
  
  return {
    plugins: [react()],
    base: basePath,
    server: {
      host: '0.0.0.0', // Allow connections from outside the container
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://backend:8000', // Use service name for Docker networking
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),    
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/images': {
        target: 'https://apibackend.megapc.tn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/images/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Add headers to mimic a real browser request
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            proxyReq.setHeader('Referer', 'https://megapc.tn/');
            proxyReq.setHeader('Accept', 'image/webp,image/apng,image/*,*/*;q=0.8');
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
        },
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      '@data': path.resolve(__dirname, 'data')
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


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
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Add headers to mimic a real browser request
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            proxyReq.setHeader('Referer', 'https://megapc.tn/');
            proxyReq.setHeader('Accept', 'image/webp,image/apng,image/*,*/*;q=0.8');
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
      }
    }
  }
})

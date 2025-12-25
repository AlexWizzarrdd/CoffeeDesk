import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import autoprefixer from 'autoprefixer';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  css: {
    postcss: {
      plugins: [
        autoprefixer
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel CLI runs on port 3000 for functions
  // Vite dev server runs on 5173
  server: {
    port: 5173, 
  },
});
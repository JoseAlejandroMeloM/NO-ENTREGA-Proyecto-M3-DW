import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // In development the API runs on :4000; in production it is same-origin /api.
  server: { proxy: { '/api': 'http://localhost:4000' } },
});

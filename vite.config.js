import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const { PORT = '3001' } = loadEnv(mode, process.cwd(), '');
  const apiTarget = `http://127.0.0.1:${PORT}`;

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': apiTarget,
        '/uploads': apiTarget
      }
    }
  };
});

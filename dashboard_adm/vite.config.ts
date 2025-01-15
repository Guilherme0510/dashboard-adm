import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Se necessário, adicione aliases aqui
    }
  },
  json: {
    // Garantir que arquivos JSON sejam tratados corretamente
    stringify: true
  }
});

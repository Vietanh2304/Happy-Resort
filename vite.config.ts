import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages chạy game ở thư mục con /Happy-Resort/ → build trên GitHub đặt PAGES_BASE
export default defineConfig({ base: process.env.PAGES_BASE ?? '/', plugins: [react()] });

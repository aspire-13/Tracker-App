/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Тесты гоняем в поясе с переходом на летнее время, чтобы ловить ошибки арифметики дат.
process.env.TZ = 'Europe/Berlin';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Трекер привычек',
        short_name: 'Привычки',
        description: 'Простой офлайн-трекер привычек',
        lang: 'ru',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#10b981',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

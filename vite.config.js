import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';

// ── Konfigurasi host Vite ──
// Default ke 'localhost' agar akses browser di laptop berjalan mulus tanpa timeout.
// Jika ingin uji coba dari HP / perangkat lain di LAN, set VITE_DEV_HOST di .env.
const lanHost = process.env.VITE_DEV_HOST || 'localhost';
const devPort = Number(process.env.VITE_DEV_PORT ?? 5180);

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
            ],
            refresh: true,
        }),
        react(),
    ],
    server: {
        host: '0.0.0.0',
        port: devPort,
        strictPort: true,
        // Isi public/hot memakai IP LAN supaya aset tetap termuat dari perangkat lain.
        origin: `http://${lanHost}:${devPort}`,
        hmr: {
            host: lanHost,
            port: devPort,
        },
        // Izinkan origin loopback maupun IP LAN (APP_URL bisa tetap localhost).
        cors: {
            origin: [
                /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?$/,
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(import.meta.dirname, 'resources/js')
        }
    }
});

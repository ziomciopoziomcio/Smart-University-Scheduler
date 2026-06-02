import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import svgr from 'vite-plugin-svgr';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), svgr()],
    envDir: '../infrastructure/docker',
    server: {
        watch: {
            usePolling: true,
            interval: 100,
            ignored: ['**/node_modules/**', '**/dist/**'],
        },
        host: true,
        port: 5173,
    },
    resolve: {
        alias: {
            '@components': path.resolve(__dirname, './src/components'),
            '@assets': path.resolve(__dirname, './src/assets'),
            '@api': path.resolve(__dirname, './src/api'),
            '@store': path.resolve(__dirname, './src/store'),
            '@constants': path.resolve(__dirname, './src/constants'),
            '@routing': path.resolve(__dirname, './src/routing')
        },
    },
})

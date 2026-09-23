import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 is wired through the Vite plugin — there is no
// postcss.config.js and no tailwind.config.js in this setup.
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: true,
        port: 5173,
    },
});

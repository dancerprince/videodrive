import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { workdriveFolderProxy } from './server/workdriveFolderProxy.js';

// WorkDrive folder listings use a same-origin proxy; no OAuth or API keys are required.
export default defineConfig({
    base: process.env.GITHUB_PAGES === 'true' ? '/videodrive/' : '/',
    plugins: [react(), tailwindcss(), workdriveFolderProxy()],
    server: { host: true, port: 5173, allowedHosts: true },
    preview: { host: true, allowedHosts: true },
});

// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite'; // Import the Tailwind CSS Vite plugin

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Add the Tailwind CSS plugin here
  ],
  define: {
    // Polyfill 'global' to 'window' for browser compatibility with AWS SDK
    global: 'window',
    // Also polyfill 'process.env' for AWS SDK's dependencies (like 'buffer')
    'process.env': {},
  },
});

import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    include: ["three", "react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  // Use Vite's default resolution for React to prefer the ESM entry points.
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react/jsx-runtime') || id.includes('react/jsx-dev-runtime')) return 'react';
            if (id.includes('@react-three/fiber') || id.includes('@react-three/drei') || id.includes('@react-three/postprocessing')) return 'r3f';
            if (id.includes('three')) return 'three';
            if (id.includes('framer-motion')) return 'framer';
          }
        },
      },
    },
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/project": "http://localhost:3001",
      "/projects": "http://localhost:3001",
      "/upload": "http://localhost:3001",
      "/analyze": "http://localhost:3001",
    },
  },
});

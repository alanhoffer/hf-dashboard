import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'apitoolbackend.ddns.net',
      'xn--cabaahoffer-4db.com.ar',
      'www.xn--cabaahoffer-4db.com.ar',
      'www.cabañahoffer.com.ar',
      'cabañahoffer.com.ar',
      'localhost',  // usualmente ya está
    ],
    // ... otras opciones del server ...
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
});

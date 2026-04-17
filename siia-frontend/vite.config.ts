import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/media": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@mui\/icons-material\/(.*)$/,
        replacement: "@mui/icons-material/esm/$1",
      },
      {
        find: "@mui/icons-material",
        replacement: "@mui/icons-material/esm",
      },
    ],
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@mui/material",
      "@mui/icons-material",
      "@mui/system",
      "@emotion/react",
      "@emotion/styled",
    ],
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Déploiement en sous-dossier sur hébergement mutualisé :
// base "./" => tous les chemins d'assets générés sont relatifs au dossier
// où se trouve index.html. Fonctionne quel que soit le sous-dossier
// (tools.macerti.com/xxx/), sans configuration supplémentaire, et reste
// valide même si le dossier de déploiement est renommé.
export default defineConfig({
  base: "./",
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

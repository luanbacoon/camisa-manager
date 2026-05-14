import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// Plugins do Manus são opcionais e só carregados quando disponíveis (ambiente Manus)
async function loadOptionalPlugins() {
  const plugins = [];

  try {
    const { jsxLocPlugin } = await import("@builder.io/vite-plugin-jsx-loc");
    plugins.push(jsxLocPlugin());
  } catch {
    // não disponível fora do ambiente Manus
  }

  try {
    const { vitePluginManusRuntime } = await import("vite-plugin-manus-runtime");
    plugins.push(vitePluginManusRuntime());
  } catch {
    // não disponível fora do ambiente Manus
  }

  return plugins;
}

export default defineConfig(async () => {
  const optionalPlugins = await loadOptionalPlugins();

  return {
    plugins: [react(), tailwindcss(), ...optionalPlugins],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      },
    },
    envDir: path.resolve(import.meta.dirname),
    root: path.resolve(import.meta.dirname, "client"),
    publicDir: path.resolve(import.meta.dirname, "client", "public"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      host: true,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        // Adicione seus domínios de deploy aqui
      ],
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});

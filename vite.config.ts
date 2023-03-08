import { defineConfig, type Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { vitePluginShiki } from "./src/lib/vite-plugin-shiki";
import monacoEditorPlugin from "vite-plugin-monaco-editor";

export default defineConfig({
  plugins: [
    devtools({ autoname: true }),
    solidPlugin(),
    tsConfigPaths(),
    vitePluginShiki({ pathToInitializedHighlighter: "/src/lib/utils.ts" }),
    monacoEditorPlugin({
      languageWorkers: [
        "editorWorkerService",
        "css",
        "html",
        "json",
        "typescript",
      ],
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
  },
});

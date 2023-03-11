import { defineConfig, loadEnv } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import { vitePluginCompilerDistWatch } from "./src/lib/vite-plugin-compiler-dist-watch.mjs";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      devtools({ autoname: true }),
      solidPlugin(),
      tsConfigPaths(),
      monacoEditorPlugin({
        languageWorkers: [
          "editorWorkerService",
          "css",
          "html",
          "json",
          "typescript",
        ],
      }),
      vitePluginCompilerDistWatch({
        relativePathToCompilerRepo: env.RELATIVE_PATH_TO_COMPILER_REPO,
      }),
    ],
    server: {
      port: 3000,
    },
    build: {
      target: "esnext",
    },
  };
});

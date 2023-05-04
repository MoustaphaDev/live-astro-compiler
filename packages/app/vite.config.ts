import { type Plugin, defineConfig, loadEnv } from "vite";
import solidPlugin from "vite-plugin-solid";
import devtools from "solid-devtools/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import monacoEditorPluginModule from "vite-plugin-monaco-editor";
import { vitePluginCompilerDistWatch } from "./src/vite-plugins/compiler-dist-watch.js";
import { vitePluginModuleGraph } from "./src/vite-plugins/module-graph-printer.js";

const monacoEditorPlugin =
  // @ts-expect-error
  monacoEditorPluginModule.default as typeof monacoEditorPluginModule;

export default defineConfig(({ mode }) => {
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
      env.RELATIVE_PATH_TO_COMPILER_REPO && mode === "development"
        ? vitePluginCompilerDistWatch({
            relativePathToCompilerRepo: env.RELATIVE_PATH_TO_COMPILER_REPO,
          })
        : null,
      vitePluginReplaceToRemoveBug(),
      !env.CI
        ? vitePluginModuleGraph({
            exclude: /node_modules/,
          })
        : null,
    ],
    server: {
      port: 3000,
    },
    build: {
      target: "esnext",
    },
  };
});

const SNIPPETS_CAUSING_ANNOYING_BUGS = [
  [
    'typeof process === "undefined" ? false : !!process.env["VSCODE_TEXTMATE_DEBUG"];',
    "false",
  ],
  [
    '"undefined" != typeof process && !!process.env.VSCODE_TEXTMATE_DEBUG',
    "false",
  ],
  [
    "typeof process !== 'undefined' && !!process.env['VSCODE_TEXTMATE_DEBUG']",
    "false",
  ],
  [`typeof process > "u" ? !1 : !!process.env.VSCODE_TEXTMATE_DEBUG;`, "false"],
  [`process.env.VSCODE_TEXTMATE_DEBUG`, "false"],
  ["#! /usr/bin/env node", ""],
] as const;

function vitePluginReplaceToRemoveBug(): Plugin {
  return {
    name: "vite-plugin-replace-to-remove-bug",
    enforce: "post",
    transform(code) {
      for (const snippet of SNIPPETS_CAUSING_ANNOYING_BUGS) {
        if (code.includes(snippet[0])) {
          return code.replaceAll(snippet[0], snippet[1]);
        }
      }
    },
  };
}

// import { setCDN } from "shiki";
import type { Plugin, ResolvedConfig } from "vite";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import npath from "node:path";
import { red, blue, green } from "kleur";

/**
 * Copies the shiki folder to the `/public/shiki` folder when they don't exist already
 */
export function vitePluginShiki({
  pathToInitializedHighlighter: entrypoint,
}: {
  pathToInitializedHighlighter: string;
}): Plugin {
  const shikiFolderPath = fileURLToPath(
    new URL("../../node_modules/shiki", import.meta.url)
  );

  // setCDN(shikiFolderPath.href);
  let config: ResolvedConfig;
  return {
    name: "vite-plugin-shiki",
    configResolved(_config) {
      config = _config;
      if (!fs.existsSync(shikiFolderPath)) {
        console.error(
          red(
            "shiki folder doesn't exist, please install `shiki` package to use this plugin"
          )
        );
        return;
      }

      const { publicDir } = config;
      const destinationPath = npath.join(publicDir, "shiki");

      if (fs.existsSync(destinationPath)) {
        console.info(blue("shiki folder already exists in `public` folder"));
        return;
      }

      //  copies the shiki folder to the `/public/shiki` folder when they don't exist already
      try {
        fs.cpSync(shikiFolderPath, destinationPath, {
          recursive: true,
        });
        console.info(green("Copied shiki folder to `public` folder"));
      } catch {
        console.error(red("Error copying shiki folder to `public` folder"));
      }
    },
    transform(code, id) {
      const entrypointPath = npath.join(config.root, entrypoint);
      if (id !== entrypointPath) {
        return;
      }
      code = `import { setCDN, setWasm } from "shiki";
setCDN("/shiki/");
const wasmResponse = await fetch("/shiki/dist/onig.wasm");
setWasm(wasmResponse);

${code}`;
      return {
        code,
      };
    },
  };
}

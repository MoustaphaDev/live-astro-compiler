// import { setCDN } from "shiki";
import type { Plugin, ResolvedConfig } from "vite";
import fs from "node:fs";
import npath from "node:path";
import kleur from "kleur";
import cprocess from "node:child_process";
import chokidar from "chokidar";

type InstallArgs = {
  /**
   * `what` is what we want to install
   */
  args: string[];
  /**
   * `cwd` is where we want to install it from, like a cd into the folder, install it and then go back
   */
  cwd?: string;
};

function runPnpm({ args, cwd }: InstallArgs) {
  const options = cwd
    ? {
        cwd,
      }
    : undefined;
  const stdout = cprocess.execFileSync("pnpm", args, options);
  console.info(kleur.blue(stdout.toString()));
}

function noopForDuration(fn: () => void, duration: number) {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    if (timeoutId === null) {
      fn();
      timeoutId = setTimeout(() => {
        timeoutId = null;
      }, duration);
    }
  };
}

/**
 * Copies the shiki folder to the `/public/shiki` folder when they don't exist already
 */
export function vitePluginCompilerDistWatch({
  relativePathToCompilerRepo,
}: {
  relativePathToCompilerRepo: string;
}): Plugin {
  let config: ResolvedConfig;
  return {
    name: "vite-plugin-compiler-dist-copy",
    configResolved(_config) {
      config = _config;
      const rootDir = config.root;

      const compilerRepoPath = npath.join(rootDir, relativePathToCompilerRepo);

      const compilerPackagePath = npath.join(
        compilerRepoPath,
        "./packages/compiler/"
      );
      if (!fs.existsSync(compilerRepoPath)) {
        return console.error(
          kleur.red(
            "Please make sure that the path to the compiler repo is correct!"
          )
        );
      }
      if (!fs.existsSync(compilerPackagePath)) {
        return console.error(
          kleur.red(
            "Please make sure that the path to the compiler package is correct!"
          )
        );
      }
      console.log(kleur.green("compiler package and repo was found!"));
      console.log({ compilerRepoPath, compilerPackagePath });

      const golangSourcePaths = [
        "./cmd",
        "./internal",
        "./internal_wasm",
        "./lib",
      ].map((p) => npath.join(compilerRepoPath, p));

      function reinstallCompilerPackage() {
        runPnpm({
          args: ["install", compilerPackagePath],
        });
      }

      function buildCompilerPackage() {
        runPnpm({
          args: ["build:all"],
          cwd: compilerRepoPath,
        });
      }

      const onSourceChange = noopForDuration(() => {
        console.log(kleur.green("Source changed!"));
        buildCompilerPackage();
        reinstallCompilerPackage();
        console.log(kleur.green("Done!"));
      }, 1000);

      const golangSourceWatcher = chokidar.watch(golangSourcePaths, {
        // ignore the compiler package path
        ignored: [compilerPackagePath],
      });

      const compilerPackageSourceWatcher = chokidar.watch(compilerPackagePath);

      golangSourceWatcher.on("all", () => {
        onSourceChange();
      });

      compilerPackageSourceWatcher.on("all", () => {
        onSourceChange();
      });
    },
  };
}

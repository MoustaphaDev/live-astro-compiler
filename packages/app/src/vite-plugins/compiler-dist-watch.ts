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
  log("info", kleur.dim(stdout.toString()));
}

function noopForDuration(fn: () => void, duration: number) {
  let timeoutId: NodeJS.Timeout | null = null;
  let doNoop = true;
  return () => {
    if (doNoop && timeoutId) {
      return;
    }
    !doNoop && fn();
    timeoutId = setTimeout(() => {
      doNoop = false;
    }, duration);
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
        return log(
          "error",
          "Please make sure that the path to the compiler repo is correct!"
        );
      }
      if (!fs.existsSync(compilerPackagePath)) {
        return log(
          "error",
          "Please make sure that the path to the compiler package is correct!"
        );
      }
      log("info", "compiler package and repo was found!");

      const golangSourcePaths = [
        "./cmd",
        "./internal",
        "./internal_wasm",
        "./lib",
      ].map((p) => npath.join(compilerRepoPath, p));

      const installCompilerPackage = () => {
        log("info", "Reinstalling compiler package...");
        runPnpm({
          args: ["install", compilerPackagePath],
        });
        log("info", "Done!");
      };

      const buildCompilerPackage = noopForDuration(() => {
        log("info", "Compiler package source changed! Rebuilding...");
        runPnpm({
          args: ["build:compiler"],
          cwd: compilerRepoPath,
        });
        log("info", "Done!");
        installCompilerPackage();
      }, 10000);

      const buildCompilerWasm = noopForDuration(() => {
        log(
          "info",
          "Compiler golang source changed! Rebuilding WASM binary..."
        );
        runPnpm({
          args: ["build"],
          cwd: compilerRepoPath,
        });
        log("info", "Done!");
        installCompilerPackage();
      }, 10000);

      const golangSourceWatcher = chokidar.watch(golangSourcePaths, {
        // ignore the compiler package path
        ignored: [compilerPackagePath],
      });

      const compilerPackageSourceWatcher = chokidar.watch(compilerPackagePath, {
        // ignore the compiler wasm binary
        ignored: [npath.join(compilerPackagePath, "./compiler.wasm")],
      });

      // TODO: find a more granular way of rebuilding the compiler package
      let didStartWatchingGolangSourceAddEvent = false;
      let didStartWatchingGolangSourceChangeEvent = false;
      let didStartWatchingGolangSourceUnlinkEvent = false;
      let didStartWatchingCompilerPackageAddEvent = false;
      let didStartWatchingCompilerPackageChangeEvent = false;
      let didStartWatchingCompilerPackageUnlinkEvent = false;
      golangSourceWatcher
        .on("add", () => {
          if (!didStartWatchingGolangSourceAddEvent) {
            didStartWatchingGolangSourceAddEvent = true;
            return;
          }
          buildCompilerWasm();
        })
        .on("change", () => {
          if (!didStartWatchingGolangSourceChangeEvent) {
            didStartWatchingGolangSourceChangeEvent = true;
            return;
          }
          buildCompilerWasm();
        })
        .on("unlink", () => {
          if (!didStartWatchingGolangSourceUnlinkEvent) {
            didStartWatchingGolangSourceUnlinkEvent = true;
            return;
          }
          buildCompilerWasm();
        });

      compilerPackageSourceWatcher
        .on("add", () => {
          if (!didStartWatchingCompilerPackageAddEvent) {
            didStartWatchingCompilerPackageAddEvent = true;
            return;
          }
          buildCompilerPackage();
        })
        .on("change", () => {
          if (!didStartWatchingCompilerPackageChangeEvent) {
            didStartWatchingCompilerPackageChangeEvent = true;
            return;
          }
          buildCompilerPackage();
        })
        .on("unlink", () => {
          if (!didStartWatchingCompilerPackageUnlinkEvent) {
            didStartWatchingCompilerPackageUnlinkEvent = true;
            return;
          }
          buildCompilerPackage();
        });
    },
  };
}

function log(
  type: "info" | "warn" | "error",
  message: string,
  /**
   * If true, don't log anything. Errors should not be silenced.
   */
  silent: boolean = false
) {
  if (silent) return;
  const date = new Date().toLocaleTimeString();
  const nameColor =
    type === "error" ? kleur.red : type === "warn" ? kleur.yellow : kleur.cyan;
  console.log(
    `${kleur.gray(date)} ${nameColor(
      kleur.bold("[compiler-source-watcher]")
    )} ${message}`
  );
}

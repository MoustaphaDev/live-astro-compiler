import type { Plugin, ResolvedConfig } from "vite";
import fs from "fs";
// forked from https://github.com/ondras/rollup-plugin-graph/tree/master
// Just did some minor changes, and migrated to TS and ES6.

type Module = {
  id: string;
  deps: string[];
};

const outputFile = "module-graph.dot";
function toDot(modules: Module[], rootDirPath: string) {
  let result = "";
  result += `digraph G {
edge [dir=back]`;

  modules.forEach((m) => {
    m.deps.forEach((dep) => {
      result += `\n"${dep}" -> "${m.id}"`;
    });
  });
  result += "\n}";
  fs.writeFileSync(outputFile, result, {
    encoding: "utf-8",
  });
  return result.replace(new RegExp(rootDirPath), "");
}

function prune(modules: Module[]) {
  let avail = modules.filter((m) => m.deps.length == 0);
  if (!avail.length) {
    return;
  }

  let id = avail[0].id;
  //    console.log("pruning", id);
  let index = modules.indexOf(avail[0]);
  modules.splice(index, 1);
  modules.forEach((m) => {
    m.deps = m.deps.filter((dep) => dep != id);
  });
  prune(modules);
}

function getPrefix(ids: string[]) {
  if (ids.length < 2) {
    return "";
  }
  return ids.reduce((prefix, val) => {
    while (val.indexOf(prefix) != 0) {
      prefix = prefix.substring(0, prefix.length - 1);
    }
    return prefix;
  });
}

type Options = {
  exclude?: RegExp;
  prune?: boolean;
};

export function vitePluginModuleGraph(options: Options = {}): Plugin {
  let exclude = (str: string) => options.exclude && str.match(options.exclude);
  let config: ResolvedConfig | undefined;
  return {
    name: "vite-plugin-module-graph",
    configResolved(_config) {
      config = _config;
    },
    generateBundle() {
      let ids: string[] = [];
      for (const moduleId of this.getModuleIds()) {
        if (!exclude(moduleId)) {
          ids.push(moduleId);
        }
      }

      let prefix = getPrefix(ids);
      let strip = (str: string) => str.substring(prefix.length);

      let modules: Module[] = [];
      ids.forEach((id) => {
        const moduleInfo = this.getModuleInfo(id);
        let m = {
          id: strip(id),
          deps: moduleInfo
            ? moduleInfo.importedIds.filter((x) => !exclude(x)).map(strip)
            : [],
        } satisfies Module;
        if (exclude(m.id)) {
          return;
        }
        modules.push(m);
      });

      if (options.prune) {
        prune(modules);
      }
      toDot(modules, config!.root);
    },
  };
}

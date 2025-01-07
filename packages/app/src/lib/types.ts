import type {
  ConvertToTSXOptions,
  ParseOptions,
  TransformOptions,
  TransformResult,
  TSXResult,
} from "@astrojs/compiler/types";
import type { MODES } from "./consts";
import type * as monaco from "monaco-editor";
import type { Accessor } from "solid-js";

export type Modes = (typeof MODES)[number];
export type Options = {
  action: Modes;
};

export type EditorValues = {
  currentCompilerVersion: string;
  wordWrapped: boolean;
  mode: Modes;
  viewDetailedResults: boolean;
  selectedTSXTab: TSXTab;
  selectedTransformTab: TransformTab;
};
export type CompilerValues = {
  code: string;
  parsePosition: ParseOptions["position"];
  transformInternalURL: TransformOptions["internalURL"];
  filename: TransformOptions["filename"] | ConvertToTSXOptions["filename"];
  normalizedFilename:
  | TransformOptions["normalizedFilename"]
  | ConvertToTSXOptions["normalizedFilename"];
  transformSourcemap: TransformOptions["sourcemap"];
  transformAstroGlobalArgs: TransformOptions["astroGlobalArgs"];
  transformCompact: TransformOptions["compact"];
  transformResultScopedSlot: TransformOptions["resultScopedSlot"];
  transformRenderScript: TransformOptions["renderScript"];
  transformAnnotateSourceFile: TransformOptions["annotateSourceFile"];
};
export type StoredSearchParams = EditorValues & CompilerValues;
export type StoredSignals = {
  [key in keyof StoredSearchParams]: Accessor<StoredSearchParams[key]>;
};

export type ConsumedTransformOptions = {
  code: string;
  transformOptions: TransformOptions;
};
export type ConsumedParseOptions = {
  code: string;
  parseOptions: ParseOptions;
};
export type ConsumedConvertToTSXOptions = {
  code: string;
  convertToTSXOptions: ConvertToTSXOptions;
};

export type EditorsHash = {
  codeCompiler: monaco.editor.IStandaloneCodeEditor | null;
  inputBox: monaco.editor.IStandaloneCodeEditor | null;
};

export type FunctionGeneric<T> = (...args: any[]) => T;

export type TSXTabToResultMap = {
  code: TSXResult["code"];
  misc: Omit<TSXResult, "code">;
};

export type TransformTabToResultMap = {
  hydration: Pick<
    TransformResult,
    "hydratedComponents" | "clientOnlyComponents"
  >;
  css: Pick<TransformResult, "css" | "styleError">;
  scripts: Pick<TransformResult, "scripts">;
  misc: Omit<
    TransformResult,
    UnionOfObjectValues<Omit<TransformTabToResultMap, "misc">> | "code"
  >;
};

export type TSXTab = keyof TSXTabToResultMap | "code";
export type TransformTab = keyof TransformTabToResultMap | "code";

type UnionOfObjectValues<T> = KeysOfUnion<T[keyof T]>;
type KeysOfUnion<T> = T extends T ? keyof T : never;

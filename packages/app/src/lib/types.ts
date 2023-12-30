import type {
  ConvertToTSXOptions,
  ParseOptions,
  TSXResult,
  TransformOptions,
  TransformResult,
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
  selectedTSXTab: TSXTabs;
  selectedTransformTab: TransformTabs;
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
  otherMetadata: Omit<TSXResult, "code">;
};

export type TransformTabToResultMap = {
  components: Pick<
    TransformResult,
    "hydratedComponents" | "clientOnlyComponents"
  >;
  css: Pick<TransformResult, "css" | "styleError">;
  scripts: Pick<TransformResult, "scripts">;
  otherMetadata: Omit<
    TransformResult,
    UnionOfObjectValues<Omit<TransformTabToResultMap, "otherMetadata">> | "code"
  >;
};

export type TSXTabs = keyof TSXTabToResultMap | "code";
export type TransformTabs = keyof TransformTabToResultMap | "code";

type UnionOfObjectValues<T> = KeysOfUnion<T[keyof T]>;
type KeysOfUnion<T> = T extends T ? keyof T : never;

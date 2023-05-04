import {
  ConvertToTSXOptions,
  ParseOptions,
  TransformOptions,
} from "@astrojs/compiler/types";
import type { MODES } from "./consts";
import type * as monaco from "monaco-editor";

export type Modes = (typeof MODES)[number];
export type Options = {
  action: Modes;
};
export type StoredSearchParams = {
  code?: string;
  wordWrapped?: boolean;
  mode?: Modes;
  parsePosition?: ParseOptions["position"];
  transformInternalURL?: TransformOptions["internalURL"];
  filename?: TransformOptions["filename"] | ConvertToTSXOptions["filename"];
  normalizedFilename?:
    | TransformOptions["normalizedFilename"]
    | ConvertToTSXOptions["normalizedFilename"];
  transformSourcemap?: TransformOptions["sourcemap"];
  transformAstroGlobalArgs?: TransformOptions["astroGlobalArgs"];
  transformCompact?: TransformOptions["compact"];
  transformResultScopedSlot?: TransformOptions["resultScopedSlot"];
};

export type ConsumedTransformOptions = {
  code?: string;
  transformOptions: TransformOptions;
};
export type ConsumedParseOptions = {
  code?: string;
  parseOptions: ParseOptions;
};
export type ConsumedConvertToTSXOptions = {
  code?: string;
  convertToTSXOptions: ConvertToTSXOptions;
};

export type EditorsHash = {
  codeCompiler: monaco.editor.IStandaloneCodeEditor | null;
  inputBox: monaco.editor.IStandaloneCodeEditor | null;
};

import type { MODES } from "./consts";

export type Modes = (typeof MODES)[number];
export type CompileOptions = {
  action: "parse" | "transform";
};

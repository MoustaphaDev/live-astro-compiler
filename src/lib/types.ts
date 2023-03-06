import type { DARK_THEMES, MODES } from "./consts";

export type AvailableThemes = (typeof DARK_THEMES)[number];
export type Modes = (typeof MODES)[number];
export type CompileOptions = {
  action: "parse" | "transform";
};

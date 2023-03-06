import type { Theme } from "shiki";
import type { AvailableThemes } from "./types";

export const DARK_THEMES = [
  "vitesse-dark",
  "slack-dark",
  "rose-pine",
  "poimandres",
  "monokai",
  "material-theme-ocean",
  "material-theme-darker",
  "dark-plus",
] satisfies Theme[];

export const MODES = ["parse", "transform"] as const;
export const DEFAULT_THEME: AvailableThemes = "vitesse-dark";

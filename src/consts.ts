import { Theme } from "shiki";

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

export type AvailableThemes = (typeof DARK_THEMES)[number];

export const DEFAULT_THEME: AvailableThemes = "vitesse-dark";

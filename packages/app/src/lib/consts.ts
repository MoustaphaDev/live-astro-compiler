import { Modes } from "./types";


export const MODES = ["parse", "transform", "TSX"] as const;
export const MODE_TO_TITLE = {
  parse: "AST result",
  transform: "TS transform",
  TSX: "TSX result",
} as const satisfies Record<Modes, any>

export const DEFAULT_MODE: Modes = "transform";

export const INITIAL_CODE = `---
import { ShareButton, ModeSwitcher, WordWrapToggle, SettingsDialog } from "./ui"
import { MouseCursor } from "./mouse"
import { Gear } from "./decoration"
import { AstroLogo } from "./assets"

console.log("Hellow world!")
---

<div class="flex h-20 items-center justify-between overflow-hidden border-b-2 border-secondary px-8 font-montserrat font-medium [&_*]:select-none">
    <h1 class="flex items-center">
    <img src={AstroLogo} class="z-10 h-14" />
    <span class="relative ml-3 h-full font-montserrat text-3xl font-medium text-white">
        Live Compiler
        <span class="absolute -top-20 left-24  text-zinc-400/30">
        <Gear class="inline h-48 w-48 animate-spin-2 motion-reduce:animate-none" />
        </span>
    </span>
    </h1>
    <span class="flex items-center gap-5">
        <ShareButton client:load />
        <ModeSwitcher client:load />
        <WordWrapToggle client:load />
        <SettingsDialog client:visible/>
        <MouseCursor client:only="solid-js"/>
    </span>
</div>`;

// same as tailwind breakpoints
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

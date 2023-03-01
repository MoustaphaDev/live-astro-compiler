import { createResource, createSignal } from "solid-js";
import { compile } from "~/utils";
import type { AvailableThemes } from "~/consts";

export const [code, setCode] = createSignal("");
export let [isAppInitialized, setIsAppInitialized] = createSignal(false);
export const [shikiTheme, setShikiTheme] =
  createSignal<AvailableThemes>("vitesse-dark");

export const [compileResult] = createResource(code, compile);

import { createResource, createSignal } from "solid-js";
import type { AvailableThemes } from "~/consts";

export const [code, setCode] = createSignal("");
export let [isAppInitialized, setIsAppInitialized] = createSignal(false);
export const [shikiTheme, setShikiTheme] =
  createSignal<AvailableThemes>("vitesse-dark");

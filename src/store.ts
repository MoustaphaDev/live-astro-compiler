import { createEffect, createResource, createSignal } from "solid-js";
import { compile } from "~/utils";
import type { AvailableThemes } from "~/consts";
import { debounce } from "@solid-primitives/scheduled";

const localStorageEntry = localStorage.getItem("code-input-value");
let persistedCode = localStorageEntry ? JSON.parse(localStorageEntry) : "";
console.log({ persistedCode });
export const [code, setCode] = createSignal(persistedCode);
const debouncedCb = debounce(() => {
  localStorage.setItem("code-input-value", JSON.stringify(code()));
  console.log("saved to local storage");
}, 1000);
createEffect(() => {
  code();
  debouncedCb();
});

export const [shikiTheme, setShikiTheme] =
  createSignal<AvailableThemes>("vitesse-dark");

export const [compileResult] = createResource(code, compile);

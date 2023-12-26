import { BsGripVertical } from "solid-icons/bs";
import {
  ErrorBoundary,
  Show,
  createEffect,
  createRenderEffect,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import Split from "split.js";
// @ts-ignore
import { emmetHTML } from "emmet-monaco-es";
import * as monaco from "monaco-editor";
import * as onigasm from "onigasm";
import onigasmWasm from "onigasm/lib/onigasm.wasm?url";
import dark from "theme-vitesse/themes/vitesse-dark.json";
import { createAstroEditor } from "~/lib/language-tools/monaco-astro";
import {
  breakpointMatches,
  code,
  currentCompilerVersion,
  getOutputByMode,
  hasCompilerVersionChangeBeenHandled,
  setCode,
  setWordWrapped,
  showMobilePreview,
  wordWrapped,
} from "~/lib/stores";
import { getPersistedValue, setPersistentValue } from "~/lib/stores/utils";
import type { EditorsHash } from "~/lib/types";
import { LoadingEditor, LoadingError } from "./ui-kit";
import { initializeCompiler } from "~/lib/stores/compiler";
import { debounce } from "@solid-primitives/scheduled";
import { debugLog } from "~/lib/utils";

let codeCompilerRef: HTMLDivElement;
let inputBoxRef: HTMLDivElement;

const editorsHash: EditorsHash = {
  codeCompiler: null,
  inputBox: null,
};

// TODO: add theme switcher
// @ts-expect-error
monaco.editor.defineTheme("vitesse-dark", dark);
monaco.editor.setTheme("vitesse-dark");

// TODO maybe add the astro language server to have proper
// diagnostics instead of just disabling them?

export function Editor() {
  createEffect(() => {
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    emmetHTML(monaco, ["html", "astro"]);
  });
  function minimapDisplayEffect() {
    if (!breakpointMatches.lg) {
      editorsHash?.codeCompiler?.updateOptions({
        minimap: { enabled: false },
      });
      editorsHash?.inputBox?.updateOptions({
        minimap: { enabled: false },
      });
      return;
    }
    editorsHash?.codeCompiler?.updateOptions({
      minimap: { enabled: true },
    });
    editorsHash?.inputBox?.updateOptions({
      minimap: { enabled: true },
    });
  }

  function toggleWordWrap(e: KeyboardEvent) {
    if (e.altKey && (e.key === "z" || e.key === "Z")) {
      setWordWrapped((wasWordWrapped) => !wasWordWrapped);
    }
  }

  const [isOnigasmLoaded, setIsOnigasmLoaded] = createSignal(false);

  queueMicrotask(async () => {
    if (isOnigasmLoaded()) return;
    // initialize the onigasm wasm
    await onigasm.loadWASM(onigasmWasm);
    setIsOnigasmLoaded(true);
    await initializeCompiler(currentCompilerVersion()!);
  });

  onMount(() => {
    minimapDisplayEffect();
    // attach word-wrap event to window when we hold ALT+Z
    window.addEventListener("keydown", toggleWordWrap);
    doSplit();
  });
  onCleanup(() => {
    window.removeEventListener("keydown", toggleWordWrap);
  });
  createRenderEffect(minimapDisplayEffect);

  return (
    <div class="flex h-full w-full flex-row items-stretch overflow-hidden">
      <div
        ref={inputBoxRef!}
        classList={{
          hidden: showMobilePreview() && !breakpointMatches.lg,
          "!w-full": !showMobilePreview() && !breakpointMatches.lg,
        }}
      >
        <Show when={isOnigasmLoaded()} fallback={<LoadingEditor />}>
          <ErrorBoundary fallback={<LoadingError />}>
            <InputBox />
          </ErrorBoundary>
        </Show>
      </div>
      <div
        ref={codeCompilerRef!}
        classList={{
          hidden: !showMobilePreview() && !breakpointMatches.lg,
          "!w-full": showMobilePreview() && !breakpointMatches.lg,
        }}
      >
        <Show
          when={hasCompilerVersionChangeBeenHandled()}
          fallback={<LoadingEditor />}
        >
          <ErrorBoundary fallback={<LoadingError />}>
            <CodeCompiler />
          </ErrorBoundary>
        </Show>
      </div>
    </div>
  );
}

function InputBox() {
  onMount(async () => {
    debugLog("Ran this effect!");
    // do load the monaco editor
    editorsHash!.inputBox = await createAstroEditor(inputBoxRef, {
      value: code(),
      automaticLayout: true,
      fontFamily: "Fira Code",
      fontLigatures: true,
    });
    editorsHash?.inputBox.onDidChangeModelContent(
      debounce(() => {
        // get the updated text content of the editor
        const text = editorsHash.inputBox!.getValue();
        setCode(text);
      }, 500),
    );
  });

  createEffect(() => {
    editorsHash?.inputBox?.updateOptions({
      wordWrap: wordWrapped() ? "on" : "off",
    });
  });

  return <></>;
}

function CodeCompiler() {
  onMount(() => {
    // load the monaco editor
    editorsHash!.codeCompiler = monaco.editor.create(codeCompilerRef, {
      // TODO: fix wrong types
      value: getOutputByMode() ?? "",
      language: "typescript",
      readOnly: true,
      automaticLayout: true,
      fontFamily: "Fira Code",
      fontLigatures: true,
    });
    createEffect(() => {
      editorsHash?.codeCompiler?.updateOptions({
        wordWrap: wordWrapped() ? "on" : "off",
      });
    });

    createEffect(
      on([getOutputByMode, currentCompilerVersion], () => {
        editorsHash?.codeCompiler?.setValue(getOutputByMode() ?? "");
      }),
    );
  });
  return <></>;
}

function doSplit() {
  const sizes = getPersistedValue("split-sizes") ?? [50, 50];
  Split([inputBoxRef, codeCompilerRef], {
    sizes,
    gutterSize: 7,
    direction: "horizontal",
    onDragEnd: (sizes) => setPersistentValue("split-sizes", sizes),
    dragInterval: 1,
    gutter: (_, direction) => {
      const gutter = (
        <div
          class={`gutter hidden lg:flex gutter-${direction} items-center justify-center bg-secondary bg-[50%_center] bg-no-repeat text-white transition-colors hover:cursor-col-resize hover:bg-accent-2 hover:text-primary active:bg-accent-2`}
        >
          <BsGripVertical class="h-auto w-4" />
        </div>
      );
      return gutter as HTMLDivElement;
    },
  });
}

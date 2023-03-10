import {
  ErrorBoundary,
  Show,
  createEffect,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import Split from "split.js";
import gutterPattern from "~/assets/vertical.png";
import dark from "theme-vitesse/themes/vitesse-dark.json";

import * as monaco from "monaco-editor";

import {
  setCode,
  code,
  getPersistantValue,
  setPersistentValue,
  compilerOutput,
  isAstroCompilerInitialized,
  setWordWrap,
  isWordWrap,
} from "~/lib/store";

let codeCompilerRef: HTMLDivElement;
let inpuBoxRef: HTMLDivElement;

let inputBoxEditorInstance: monaco.editor.IStandaloneCodeEditor;
let codeCompilerEditorInstance: monaco.editor.IStandaloneCodeEditor;

// TODO: add theme switcher
monaco.editor.defineTheme("vitesse-dark", dark);
monaco.editor.setTheme("vitesse-dark");

export function Editor() {
  function toggleWordWrap(e: KeyboardEvent) {
    if (e.altKey && (e.key === "z" || e.key === "Z")) {
      setWordWrap((wasWordWrapped) => !wasWordWrapped);
    }
  }

  onMount(() => {
    // attach word-wrap event to window when we hold ALT+Z
    window.addEventListener("keydown", toggleWordWrap);
    doSplit();
  });
  onCleanup(() => {
    window.removeEventListener("keydown", toggleWordWrap);
  });

  return (
    <div class="flex h-full w-full flex-row items-stretch overflow-hidden">
      <div ref={inpuBoxRef!}>
        {/* <Show when={isMonacoloaded()} fallback={<LoadingEditor />}> */}
        <ErrorBoundary fallback={<div>Oh no!</div>}>
          <InputBox />
        </ErrorBoundary>
        {/* </Show> */}
      </div>
      <div ref={codeCompilerRef!}>
        <Show when={isAstroCompilerInitialized()} fallback={<LoadingEditor />}>
          <ErrorBoundary fallback={<div>Oh no!</div>}>
            <CodeCompiler />
          </ErrorBoundary>
        </Show>
      </div>
    </div>
  );
}

function InputBox() {
  // props: { ref: HTMLDivElement }
  onMount(() => {
    // do load the monaco editor
    inputBoxEditorInstance = monaco.editor.create(inpuBoxRef, {
      value: code(),
      language: "javascript",
      automaticLayout: true,
    });
    inputBoxEditorInstance.onDidChangeModelContent(() => {
      // get the updated text content of the editor
      const text = inputBoxEditorInstance.getValue();
      setCode(text);
    });

    createEffect(() => {
      if (isWordWrap()) {
        inputBoxEditorInstance?.updateOptions({
          wordWrap: "off",
        });
        return;
      }
      inputBoxEditorInstance?.updateOptions({
        wordWrap: "on",
      });
      return;
    });
  });

  return <></>;
}

function CodeCompiler() {
  // TODO: Prevent compiling both the parse and transform result as only one is needed at a time

  createEffect(
    on(compilerOutput, () => {
      // Set the new value
      codeCompilerEditorInstance?.setValue(compilerOutput() ?? "");
    })
  );

  onMount(() => {
    // do load the monaco editor
    codeCompilerEditorInstance = monaco.editor.create(codeCompilerRef, {
      value: compilerOutput(),
      language: "javascript",
      readOnly: true,
      automaticLayout: true,
    });
    createEffect(() => {
      if (isWordWrap()) {
        codeCompilerEditorInstance?.updateOptions({
          wordWrap: "off",
        });
        return;
      }
      codeCompilerEditorInstance?.updateOptions({
        wordWrap: "on",
      });
      return;
    });
  });
  return <></>;
}

export function LoadingEditor() {
  return (
    <div class="flex h-full w-full items-center justify-center bg-primary">
      <div class="h-32 w-32 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
    </div>
  );
}

export function LoadingError() {
  return (
    <div class="flex h-full w-full items-center justify-center bg-primary">
      <div class="text-4xl font-bold text-red-600">X</div>
    </div>
  );
}

function doSplit() {
  const sizes = getPersistantValue("split-sizes", [50, 50]);
  Split([inpuBoxRef, codeCompilerRef], {
    sizes,
    gutterSize: 7,
    direction: "horizontal",
    onDragEnd: function (sizes) {
      localStorage.setItem("split-sizes", JSON.stringify(sizes));
      setPersistentValue;
    },
    dragInterval: 1,
    gutter: (_, direction) => {
      const gutter = (
        <div
          class={`gutter gutter-${direction} hover:bg bg-secondary bg-[url:var(--gutter-bg-url)] bg-[50%_center] bg-no-repeat transition-colors hover:cursor-col-resize hover:bg-accent-2/60 active:bg-accent-2`}
          style={`--gutter-bg-url:url(${gutterPattern})`}
        ></div>
      );
      return gutter as HTMLDivElement;
    },
  });
}

import { debounce } from "@solid-primitives/scheduled";
import {
  ErrorBoundary,
  Suspense,
  createEffect,
  createResource,
  onMount,
} from "solid-js";
import Split from "split.js";
import gutterPattern from "~/assets/vertical.png";

// TODO find a way to transform the highlighter's result to JSX nodes (if possible?) to benefit from diffing
import html from "solid-js/html";
import * as monaco from "monaco-editor";

import {
  setCode,
  shikiTheme,
  code,
  getPersistantValue,
  setPersistentValue,
  mode,
  transformResult,
  parseResult,
} from "~/lib/store";
import { highlight, setHightlighter } from "~/lib/utils";

let codeCompilerRef: HTMLDivElement;
let inpuBoxRef: HTMLDivElement;

let inputBoxEditorInstance: monaco.editor.IStandaloneCodeEditor;
let codeCompilerEditorInstance: monaco.editor.IStandaloneCodeEditor;
export function Editor() {
  onMount(() => {
    doSplit();
  });
  return (
    <div class="flex h-full w-full flex-row items-stretch overflow-hidden">
      <InputBox ref={inpuBoxRef!} />
      <CodeCompiler ref={codeCompilerRef!} />
    </div>
  );
}

function InputBox(props: { ref: HTMLDivElement }) {
  onMount(() => {
    // do load the monaco editor
    inputBoxEditorInstance = monaco.editor.create(inpuBoxRef, {
      value: code(),
      language: "javascript",
      automaticLayout: true,
    });
    inputBoxEditorInstance.onDidChangeModelContent(function (event) {
      // get the updated text content of the editor
      const text = inputBoxEditorInstance.getValue();
      setCode(text);
      console.log(text);
      codeCompilerEditorInstance.getModel()?.setValue(transformResult());
    });
  });

  return <div ref={props.ref}></div>;
}

function CodeCompiler(props: { ref: HTMLDivElement }) {
  // TODO: Prevent compiling both the parse and transform result as only one is needed at a time
  const [transformResultHighlighted, { refetch: refreshCompileTheme }] =
    createResource(transformResult, highlight);

  const [parseResultHighlighted, { refetch: refreshParseTheme }] =
    createResource(parseResult, highlight);
  createEffect(async () => {
    await setHightlighter(shikiTheme());
    refreshCompileTheme();
    refreshParseTheme();
  });

  onMount(() => {
    // do load the monaco editor
    codeCompilerEditorInstance = monaco.editor.create(codeCompilerRef, {
      value: transformResult(),
      language: "javascript",
      readOnly: true,
      automaticLayout: true,
    });
    codeCompilerEditorInstance.getModel()?.setValue(transformResult());
  });

  return <div ref={props.ref}></div>;
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

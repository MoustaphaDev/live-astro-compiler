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
let inpuBoxRef: HTMLTextAreaElement;
export function Editor() {
  onMount(() => {
    console.log({ inpuBoxRef, codeCompilerRef });
    doSplit();
  });
  return (
    <div class="flex h-full w-full flex-row items-stretch overflow-hidden">
      <InputBox ref={inpuBoxRef!} />
      <div class="h-full w-[calc(50%-5px)] overflow-auto" ref={codeCompilerRef}>
        <ErrorBoundary fallback={<LoadingError />}>
          <Suspense fallback={<LoadingEditor />}>
            <CodeCompiler />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

function InputBox(props: { ref: HTMLTextAreaElement }) {
  const onInput = debounce((e: InputEvent) => {
    setCode((e.target as HTMLInputElement).value);
  }, 400);

  return (
    <textarea
      class="h-full w-[calc(50%-5px)] resize-none bg-primary pt-5 font-fira-code text-white outline-transparent focus-within:outline-none focus:outline-none"
      ref={props.ref}
      onInput={onInput}
      value={code()}
    />
  );
}

function CodeCompiler() {
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

  const highlightedResult = () =>
    mode() === "transform"
      ? transformResultHighlighted()
      : parseResultHighlighted();

  return <div innerHTML={highlightedResult()!} class="h-full w-full"></div>;
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
    gutterSize: 8,
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

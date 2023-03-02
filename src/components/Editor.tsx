import { debounce } from "@solid-primitives/scheduled";
import { Suspense, createEffect, createResource, onMount } from "solid-js";
import Split from "split.js";
import gutterPattern from "~/assets/vertical.png";

import { setCode, compileResult, shikiTheme, code } from "~/store";
import { highlight, setHightlighter } from "~/utils";

let codeCompilerRef: HTMLDivElement;
let inpuBoxRef: HTMLTextAreaElement;
let loadingEditorRef: HTMLDivElement;
export function Editor() {
  onMount(() => {
    console.log({ inpuBoxRef, codeCompilerRef });
    doSplit();
  });
  return (
    <div class="flex h-full w-full flex-row items-stretch overflow-hidden">
      <InputBox ref={inpuBoxRef!} />
      <div class="h-full w-[calc(50%-5px)] overflow-auto" ref={codeCompilerRef}>
        <Suspense fallback={<LoadingEditor ref={loadingEditorRef!} />}>
          <CodeCompiler />
        </Suspense>
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
  const [compileResultHighlighted, { refetch: refreshTheme }] = createResource(
    compileResult,
    highlight
  );
  createEffect(async () => {
    await setHightlighter(shikiTheme());
    refreshTheme();
  });

  return (
    <div innerHTML={compileResultHighlighted()!} class="h-full w-full"></div>
  );
}

export function LoadingEditor(props: { ref: HTMLDivElement }) {
  return (
    <div
      class="flex h-full w-full items-center justify-center bg-primary"
      ref={props.ref}
    >
      <div class="h-32 w-32 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
    </div>
  );
}

function doSplit() {
  const localStorageEntry = localStorage.getItem("split-sizes");
  let sizes = localStorageEntry ? JSON.parse(localStorageEntry) : [50, 50];
  Split([inpuBoxRef, codeCompilerRef], {
    sizes,
    gutterSize: 8,
    direction: "horizontal",
    onDragEnd: function (sizes) {
      localStorage.setItem("split-sizes", JSON.stringify(sizes));
      console.log({ sizes });
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

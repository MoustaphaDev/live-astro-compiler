import { debounce } from "@solid-primitives/scheduled";
import {
  Show,
  Suspense,
  createEffect,
  createResource,
  onMount,
  useTransition,
} from "solid-js";
import Split from "split.js";
import gutterPattern from "~/assets/vertical.png";
import {
  isAppInitialized,
  setCode,
  setIsAppInitialized,
  compileResult,
  shikiTheme,
} from "~/store";
import { highlight, setHightlighter } from "~/utils";

let codeCompilerRef: HTMLDivElement;
let inpuBoxRef: HTMLTextAreaElement;
export function Editor() {
  onMount(() => {
    console.log({ inpuBoxRef, codeCompilerRef });
  });
  return (
    <div class="flex h-full w-full flex-row items-stretch overflow-hidden">
      <InputBox ref={inpuBoxRef!} />
      <CodeCompiler ref={codeCompilerRef!} />
    </div>
  );
}

function InputBox(props: { ref: HTMLTextAreaElement }) {
  const onInput = debounce((e: InputEvent) => {
    setCode((e.target as HTMLInputElement).value);
  }, 400);

  onMount(() => {
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
            class={`gutter gutter-${direction} bg-secondary bg-[url:var(--gutter-bg-url)] bg-[50%_center] bg-no-repeat transition-colors hover:cursor-col-resize hover:bg-accent-2/60 active:bg-accent-2`}
            style={`--gutter-bg-url:url(${gutterPattern})`}
          ></div>
        );
        return gutter as HTMLDivElement;
      },
    });
  });

  return (
    <textarea
      class="h-full w-[calc(50%-5px)] resize-none bg-primary pt-5 font-fira-code text-white outline-transparent focus-within:outline-none focus:outline-none"
      ref={props.ref}
      onInput={onInput}
    />
  );
}

function CodeCompiler(props: { ref: HTMLDivElement }) {
  onMount(() => {
    setIsAppInitialized(true);
  });
  const [compileResultHighlighted, { refetch: refreshTheme }] = createResource(
    compileResult,
    highlight
  );
  const [isPending, startTransition] = useTransition();
  const refreshThemeTransition = () => startTransition(() => refreshTheme());

  createEffect(async () => {
    await setHightlighter(shikiTheme());
    refreshThemeTransition();
  });

  return (
    <div
      innerHTML={compileResultHighlighted()!}
      ref={props.ref}
      classList={{
        "h-full w-[calc(50%-5px)] overflow-auto": true,
        "bg-red-600": isPending(),
      }}
    ></div>
  );
}

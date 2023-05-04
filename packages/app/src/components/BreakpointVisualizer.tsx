import { createSignal } from "solid-js";

export function BreakpointVisualizer() {
  const [reduced, setReduced] = createSignal(false);
  return (
    <div
      onClick={() => setReduced((wasReduced) => !wasReduced)}
      classList={{
        "fixed bottom-1/2 left-0 z-[100] flex h-20 items-center justify-center transition-transform cursor-pointer duration-100 transform-gpu rounded overflow-hidden divide-x divide-zinc-800":
          true,
        "-translate-x-[80%] opacity-80": reduced(),
      }}
    >
      <div class="bg-zinc-900 px-4 py-2">
        <span class="text-sm font-medium text-zinc-100">normal</span>
      </div>
      <div class="bg-zinc-800 px-4 py-2 sm:bg-zinc-900">
        <span class="text-sm font-medium text-zinc-200 sm:text-zinc-100">
          sm
        </span>
      </div>
      <div class="bg-zinc-800 px-4 py-2 md:bg-zinc-900">
        <span class="text-sm font-medium text-zinc-200 md:text-zinc-100">
          md
        </span>
      </div>
      <div class="bg-zinc-800 px-4 py-2 lg:bg-zinc-900">
        <span class="text-sm font-medium text-zinc-200 lg:text-zinc-100">
          lg
        </span>
      </div>
      <div class="bg-zinc-800 px-4 py-2 xl:bg-zinc-900">
        <span class="text-sm font-medium text-zinc-200 xl:text-zinc-100">
          xl
        </span>
      </div>
    </div>
  );
}

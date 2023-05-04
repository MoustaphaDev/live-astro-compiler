import { onMount } from "solid-js";

import { VsChromeClose } from "solid-icons/vs";
import { Dialog } from "@kobalte/core";
import { Separator, TextField, ToggleButton, ToggleField } from "./ui-kit";
import {
  parsePosition,
  setParsePosition,
  transformInternalURL,
  setTransformInternalURL,
  filename,
  setFilename,
  normalizedFilename,
  setNormalizedFilename,
  transformAstroGlobalArgs,
  setTransformAstroGlobalArgs,
  transformCompact,
  setTranformCompact,
  transformResultScopedSlot,
  setTransformResultScopedSlot,
} from "~/lib/stores";

export default function SettingsSection() {
  let dialogHeader: HTMLDivElement | null = null;
  let dialogDescriptionRef: HTMLDivElement | null = null;
  let parseOptionsRef: HTMLHeadingElement | null = null;
  onMount(() => {
    // take the `parseOptions` heading as a reference to observe the scrolled navbar
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          dialogHeader!.classList.add("shadow-custom");
        } else {
          dialogHeader!.classList.remove("shadow-custom");
        }
      },
      { rootMargin: "-50px", root: dialogDescriptionRef! }
    );
    observer.observe(parseOptionsRef!);
  });

  return (
    <div class="fixed top-0 z-50 h-screen [&_*]:select-none [@supports_selector(:has(+_*))]:[&:has([data-closed])]:animate-[contentHide_300ms_cubic-bezier(0.4,_0,_0.2,_1)] [@supports_selector(:has(+_*))]:[&:has([data-expanded])]:animate-[contentShow_300ms_cubic-bezier(0.4,_0,_0.2,_1)]">
      <Dialog.Content class="z-50 h-full w-screen overflow-hidden rounded-md bg-primary font-montserrat sm:w-[700px] sm:max-w-[min(calc(100vw_-_16px),1000px)]">
        <div
          class="flex h-24 items-center justify-between overflow-y-auto bg-zinc-900 px-5 transition-shadow duration-200 sm:px-10"
          ref={dialogHeader!}
        >
          <Dialog.Title class="text-3xl font-bold text-white">
            Settings
          </Dialog.Title>
          <Dialog.CloseButton class="h-6 w-6 text-zinc-600 outline-none transition-colors hover:text-zinc-500 focus-visible:text-zinc-500 focus-visible:ring-2 focus-visible:ring-accent-2">
            <VsChromeClose class="h-6 w-6" />
          </Dialog.CloseButton>
        </div>
        <Dialog.Description
          class="relative h-[calc(100vh-theme(spacing.24))] w-full overflow-auto px-5 text-base text-zinc-700 sm:px-10 [&::-webkit-scrollbar-thumb]:rounded-full"
          ref={dialogDescriptionRef!}
        >
          <div class="mt-10 flex h-full flex-col space-y-10">
            {/* // display all the `Parse` options */}
            <div>
              <h3
                class="text-md mb-2 font-bold text-white"
                ref={parseOptionsRef!}
              >
                Parse Options
              </h3>
              <div>
                <ToggleField label="position">
                  <ToggleButton
                    isPressed={parsePosition()}
                    onPressedChange={setParsePosition}
                    title="Toggle position"
                    aria-label="Toggle positoin"
                  >
                    <div></div>
                  </ToggleButton>
                </ToggleField>
              </div>
            </div>
            {/* // display all the `Transform` options */}
            <Separator />
            <div>
              <h3 class="text-md mb-2 font-bold text-white">
                Transform Options
              </h3>
              <div>
                <TextField
                  placeholder="internalURL"
                  value={transformInternalURL()}
                  onValueChange={setTransformInternalURL}
                >
                  internalURL
                </TextField>
                <TextField
                  placeholder="filename"
                  value={filename()}
                  onValueChange={setFilename}
                >
                  filename
                </TextField>
                <TextField
                  placeholder="normalizedFilename"
                  value={normalizedFilename()}
                  onValueChange={setNormalizedFilename}
                >
                  normalizedFilename
                </TextField>
                <TextField
                  placeholder="astroGlobalArgs"
                  value={transformAstroGlobalArgs()}
                  onValueChange={setTransformAstroGlobalArgs}
                >
                  astroGlobalArgs
                </TextField>
                <ToggleField label="compact">
                  <ToggleButton
                    isPressed={transformCompact()!}
                    onPressedChange={setTranformCompact}
                    title="Toggle compact"
                    aria-label="Toggle compact"
                  >
                    <div></div>
                  </ToggleButton>
                </ToggleField>
                <ToggleField label="resultScopedSlot">
                  <ToggleButton
                    isPressed={transformResultScopedSlot()}
                    onPressedChange={setTransformResultScopedSlot}
                    title="Toggle position"
                    aria-label="Toggle positoin"
                  >
                    <div></div>
                  </ToggleButton>
                </ToggleField>
              </div>
            </div>
            {/* // display all the `ConvertToTSX` options */}
            <Separator />
            <div>
              <h3 class="text-md mb-2 font-bold text-white">
                ConvertToTSX Options
              </h3>
              <div>
                <TextField
                  placeholder="filename"
                  value={filename()}
                  onValueChange={setFilename}
                >
                  convertToTSXFilename
                </TextField>
                <TextField
                  placeholder="normalizedFilename"
                  value={normalizedFilename()}
                  onValueChange={setNormalizedFilename}
                >
                  normalizedFilename
                </TextField>
              </div>
            </div>
            <div class="flex h-full w-full !select-text items-end justify-center text-center font-montserrat text-zinc-300">
              <div class="w-full">
                <Separator />
                <div class="my-14">
                  Made with <span class=" text-red-500">♥</span> by{" "}
                  <a
                    href="https://github.com/MoustaphaDev"
                    class="!select-text italic text-accent-2 hover:underline"
                  >
                    Moustapha Kebe
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Description>
      </Dialog.Content>
    </div>
  );
}

import AstroLogo from "~/assets/astro-logo.svg";
import { TbTextWrap } from "solid-icons/tb";
import { BsCheckCircleFill, BsGearWideConnected } from "solid-icons/bs";
import { IoSettingsOutline, IoOpenOutline } from "solid-icons/io";
import { HiOutlineChevronUpDown } from "solid-icons/hi";
import {
  For,
  createEffect,
  createSignal,
  on,
  createSelector,
  lazy,
  Show,
} from "solid-js";
import { Button, Dialog, Select as SelectPrimitive } from "@kobalte/core";

import { MODES, MODE_TO_TITLE } from "~/lib/consts";
import { SegmentedButton, ToggleButton } from "./ui-kit";
import {
  wordWrapped,
  setWordWrapped,
  showMobilePreview,
  breakpointMatches,
  mode,
  code,
  setMode,
  setShowMobilePreview,
  currentCompilerVersion,
  setShowSourceMapVisualizer,
  getCompilerOutput,
} from "~/lib/stores";
import type { Modes } from "~/lib/types";
import type { SettingsSectionProps } from "./Settings";
import { createSourcemapURL } from "~/lib/utils";
import { toast } from "solid-sonner";
import { SearchParamsHelpers } from "~/lib/stores/utils";

export function Header() {
  return (
    <div>
      <div class="flex h-20 items-center justify-between overflow-hidden border-b-2 border-zinc-900 px-4 font-montserrat font-medium lg:border-secondary lg:px-8 [&_*]:select-none">
        <h1 class="flex items-center">
          <img src={AstroLogo} class="z-10 h-8 sm:h-10 lg:h-14" />
          <span class="xs:text-xl relative ml-3 h-full font-montserrat text-lg font-semibold text-white lg:text-3xl lg:font-medium">
            Live Compiler{" "}
            <span class="xs:text-lg text-base font-medium text-zinc-400 lg:text-2xl">
              v{currentCompilerVersion()}
            </span>
            <span class="absolute -top-20 left-24 hidden text-zinc-400/30 lg:block">
              <BsGearWideConnected class="inline h-48 w-48 animate-spin-2 motion-reduce:animate-none" />
            </span>
          </span>
        </h1>
        <span class="flex items-center gap-5">
          <ShareButton />
          <DesktopModeSwitcher />
          <WordWrapToggle />
          {/* <DiagnosticsToggle /> */}
          <SettingsDialog />
          <SectionToSourceMapVisualizer />
          {/* <ThemeSwitcher /> */}
        </span>
      </div>
      <MobileModeSwitcher />
    </div>
  );
}

function createNoopAfterFirstCall(fn: () => void) {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    return fn();
  };
}

const loadSettingsSection = () => lazy(() => import("./Settings"));

function SettingsDialog() {
  const [isLoadedSettingsSection, setLoadedSettingsSection] =
    createSignal(false);
  const noopAfterFirstCall = createNoopAfterFirstCall(() =>
    setLoadedSettingsSection(true),
  );
  const [isOpen, setIsOpen] = createSignal(false);
  const closeModal = () => setIsOpen(false);

  let SettingsSection = (props: SettingsSectionProps) => <></>;
  createEffect(() => {
    if (!isLoadedSettingsSection()) return;
    SettingsSection = loadSettingsSection();
    setLoadedSettingsSection(true);
  });
  return (
    <Dialog.Root modal open={isOpen()} onOpenChange={setIsOpen}>
      <Dialog.Trigger
        onClick={noopAfterFirstCall}
        class="inline-flex h-8 w-8 appearance-none items-center justify-center rounded-md border border-solid border-secondary bg-secondary text-base capitalize leading-none text-white outline-none ring-offset-2 ring-offset-primary transition-all duration-[250ms,color] hover:border-accent-2/50 hover:bg-accent-2 hover:text-primary hover:ring-offset-0 focus:ring-2 focus:ring-accent-2  focus-visible:outline-offset-2 focus-visible:outline-accent-2 active:bg-accent-2 lg:h-10 lg:w-10 [&_*]:select-none "
      >
        <IoSettingsOutline class="h-5 w-5" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 z-50 animate-[overlayHide_250ms_ease_100ms_forwards] bg-[rgba(0,0,0,0.57)] data-[expanded]:animate-[overlayShow_250ms_ease]" />
        <SettingsSection closeModal={closeModal} />
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function WordWrapToggle() {
  return (
    <ToggleButton
      pressed={wordWrapped()!}
      onChange={setWordWrapped}
      title="Toggle word wrap"
      aria-label="Toggle word wrap"
      class="hidden lg:inline"
    >
      <TbTextWrap class="text-xl" />
    </ToggleButton>
  );
}

function SectionToSourceMapVisualizer() {
  // opens the source evanw source map visualizer
  async function openSourcemapVisualization() {
    const sourceMapUrl = await createSourcemapURL(
      getCompilerOutput().tsxResult?.(),
    );

    if (!sourceMapUrl) {
      toast.error("No source map found");
      return;
    }

    window.open(sourceMapUrl, "_blank");
  }

  const showSourceMapVisualizer = () => {
    return (showMobilePreview() || breakpointMatches.lg) && mode() === "TSX";
  };

  createEffect(() => {
    if (mode() === "TSX") {
      setShowSourceMapVisualizer(false);
    }
  });

  return (
    <Show when={showSourceMapVisualizer()}>
      <div class="fixed bottom-10 right-0 z-50 flex w-full items-center justify-center lg:justify-end lg:pr-10">
        <div class="flex items-center rounded bg-zinc-900 transition-all duration-100 hover:bg-zinc-800 hover:text-zinc-200 focus:bg-zinc-800 focus:text-zinc-200">
          <Button.Root
            onClick={openSourcemapVisualization}
            class="group rounded px-6 py-3 text-zinc-500 outline-none transition-colors duration-100 hover:text-zinc-200 focus:text-zinc-200 focus:ring focus:ring-accent-2"
          >
            <span class="mr-4 w-0 overflow-hidden">Visualize Source map</span>
            <span class="inline-block -translate-y-[2px] text-zinc-700 duration-100 group-hover:text-zinc-400 group-focus:text-zinc-400">
              <IoOpenOutline class="inline h-6 w-6" />
            </span>
          </Button.Root>
        </div>
      </div>
    </Show>
  );
}

function ShareButton() {
  const [showCopied, setShowCopied] = createSignal(false);
  function share() {
    if (showCopied()) return;
    if (!navigator?.clipboard?.writeText) {
      alert("Your browser does not support clipboard sharing");
      return;
    }
    const statefulURL = SearchParamsHelpers.computePlaygroundStatefulURL();
    navigator.clipboard.writeText(statefulURL);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 3000);
  }

  // Reset showCopy when any of these change
  createEffect(
    on([mode, code, wordWrapped], () => {
      setShowCopied(false);
    }),
  );

  return (
    <Button.Root
      class={`relative h-8 w-20 items-center justify-center rounded-md border border-solid border-secondary py-0 text-sm capitalize leading-none outline-none ring-offset-2 ring-offset-primary transition-all duration-[250ms,color] focus:ring-2 lg:h-10 lg:w-28 lg:px-4 lg:text-base ${
        showCopied()
          ? "bg-green-500 text-primary  hover:border-green-500/50 hover:bg-green-500 focus:ring-green-500"
          : "bg-secondary text-white hover:border-accent-2/50 hover:bg-accent-2 hover:text-primary focus:ring-accent-2"
      }`}
      onClick={share}
    >
      <div
        class={`absolute inset-0 flex items-center justify-center px-2 text-center transition-opacity ${
          showCopied() ? "opacity-0" : ""
        }`}
      >
        <span>Share</span>
      </div>
      <div
        class={`absolute inset-0 flex items-center justify-center px-2 transition-opacity ${
          !showCopied() ? "opacity-0" : ""
        }`}
      >
        <span>Copied</span>
      </div>
    </Button.Root>
  );
}

// function DiagnosticsToggle() {
//   return (
//     <ToggleButton
//       isPressed={enabledDiagnostics()}
//       onPressedChange={setEnabledDiagnostics}
//       title="Toggle diagnostics"
//       aria-label="Toggle diagnostics"
//     >
//       <VsBracketError class="text-xl" />
//     </ToggleButton>
//   );
// }

function DesktopModeSwitcher() {
  return (
    <SelectPrimitive.Root
      onChange={(val) => val && setMode(val)}
      aria-label="Switch mode"
      value={mode()}
      placeholder="Select a mode"
      selectionBehavior="replace"
      // @ts-expect-error
      options={MODES}
      itemComponent={(props) => {
        return (
          <SelectPrimitive.Item
            class="select__item cursor-pointer"
            item={props.item}
            onclick={() => setMode(mode)}
          >
            <SelectPrimitive.ItemLabel class="capitalize">
              {props.item.rawValue}
            </SelectPrimitive.ItemLabel>
            <SelectPrimitive.ItemIndicator class="select__item-indicator">
              <BsCheckCircleFill />
            </SelectPrimitive.ItemIndicator>
          </SelectPrimitive.Item>
        );
      }}
    >
      <SelectPrimitive.Trigger
        class="hidden h-8 w-[100px] items-center justify-between rounded-md border border-solid border-secondary bg-primary py-0 pl-4 pr-2.5 text-sm capitalize leading-none text-zinc-200 outline-none ring-offset-2 ring-offset-primary transition-shadow duration-[250ms,color] hover:border-accent-2/50 hover:bg-accent-2/10 focus:ring-2 focus:ring-accent-2  data-[invalid]:border-[hsl(0_72%_51%)] data-[invalid]:text-[hsl(0_72%_51%)] lg:inline-flex lg:h-10 lg:w-[200px] lg:text-sm"
        aria-label="Themes"
      >
        <SelectPrimitive.Value<Modes> class="overflow-hidden text-ellipsis whitespace-nowrap data-[placeholder-shown]:text-zinc-500">
          {(state) => MODE_TO_TITLE[state.selectedOption()]}
        </SelectPrimitive.Value>

        <SelectPrimitive.Icon class="select__icon">
          <HiOutlineChevronUpDown />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content class="select__content">
          <SelectPrimitive.Listbox class="select__listbox" />
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function MobileModeSwitcher() {
  // TODO: refactor the span tabs using the accessible `Tabs`
  // component from kobalte
  return (
    <div class="flex flex-row items-center px-4">
      <ModeSwitcherButton />
      <div>
        <SegmentedButton
          options={["Editor", "Preview"]}
          isMobile
          activeOption={showMobilePreview() ? "Preview" : "Editor"}
          handleOptionChange={(option) =>
            setShowMobilePreview(option === "Preview")
          }
        />
      </div>
    </div>
  );
}

function ModeSwitcherButton() {
  const isSelected = createSelector(mode);
  const reducedModeToTitle = Object.fromEntries(
    Object.entries(MODE_TO_TITLE).map(([k, v]) => [k, v.split(" ")[0]]),
  );
  return (
    <div
      class={`shrink-1 flex w-full grow-0 flex-nowrap bg-primary font-montserrat transition-all duration-300 lg:hidden ${
        !showMobilePreview()
          ? "-translate-x-full opacity-0 motion-reduce:hidden"
          : ""
      }`}
    >
      <For each={MODES}>
        {(mode) => (
          <button
            onClick={() => setMode(mode)}
            classList={{
              "relative capitalize py-4 inline-block outline-none w-min px-4 text-sm focus:after:content-[''] focus:after:h-1 focus:bg-zinc-900 focus:after:bottom-0 focus:after:absolute focus:after:w-full focus:after:left-0 hover:bg-zinc-900/50":
                true,
              [!isSelected(mode)
                ? "text-zinc-200 focus:after:bg-zinc-700"
                : "text-accent-2"]: true,
              "after:content-[''] after:h-1 after:bottom-0 after:absolute after:w-full after:left-0 after:bg-accent-2 text-accent-2 font-semibold rounded-t":
                isSelected(mode),
            }}
          >
            {reducedModeToTitle[mode]}
          </button>
        )}
      </For>
    </div>
  );
}

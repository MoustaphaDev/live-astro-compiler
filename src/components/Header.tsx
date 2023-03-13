import { FaSolidGears } from "solid-icons/fa";
import { HiOutlineSelector } from "solid-icons/hi";
import AstroLogo from "~/assets/astro-logo.svg";
import { TbTextWrap } from "solid-icons/tb";

import { For } from "solid-js";
import { Select as SelectPrimitive, ToggleButton } from "@kobalte/core";
import { isWordWrap, mode, setMode, setWordWrap } from "../lib/store";

import { type ComponentProps, splitProps } from "solid-js";
import { AiOutlineCheck } from "solid-icons/ai";
import { MODES } from "~/lib/consts";

export function SelectItem(props: ComponentProps<typeof SelectPrimitive.Item>) {
  const [local, others] = splitProps(props, ["children"]);
  return (
    <SelectPrimitive.Item class="select__item" {...others}>
      <SelectPrimitive.ItemLabel>{local.children}</SelectPrimitive.ItemLabel>
      <SelectPrimitive.ItemIndicator class="select__item-indicator">
        <AiOutlineCheck />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function Select(
  props: ComponentProps<typeof SelectPrimitive.Root> & {
    "aria-label": string;
    placeholder: string;
  }
) {
  const [local, others] = splitProps(props, ["children", "placeholder"]);
  return (
    <SelectPrimitive.Root {...others}>
      <SelectPrimitive.Trigger class="select__trigger" aria-label="Themes">
        <SelectPrimitive.Value
          class="select__value"
          placeholder={local.placeholder}
        />
        <SelectPrimitive.Icon class="select__icon">
          <HiOutlineSelector />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content class="select__content">
          <SelectPrimitive.Listbox class="select__listbox">
            {local.children}
          </SelectPrimitive.Listbox>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function WordWrapToggle() {
  return (
    <ToggleButton.Root
      isPressed={isWordWrap()}
      onPressedChange={setWordWrap}
      class="box-content h-10 w-[calc(theme(spacing.8)*3)] rounded-full border border-solid border-secondary bg-primary leading-none text-white outline-none ring-offset-0 ring-offset-primary transition-shadow duration-[250ms,color] hover:border-accent-2/50 hover:bg-accent-2/10 focus:ring-2 focus:ring-accent-2"
      aria-label="Toggle word wrap"
    >
      <span
        class={`ml-1 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          isWordWrap()
            ? "bg-secondary"
            : "translate-x-[calc(200%-theme(spacing.2))] bg-accent-2"
        }`}
      >
        <TbTextWrap class="text-xl" />
      </span>
    </ToggleButton.Root>
  );
}
// .select__trigger[data-invalid] {
//   @apply border-[hsl(0_72%_51%)] text-[hsl(0_72%_51%)];
// }
// function ThemeSwitcher() {
//   return (
//     <Select
//       aria-label="Themes"
//       value={shikiTheme()}
//       onValueChange={setShikiTheme}
//       placeholder="Select a theme"
//     >
//       <For each={DARK_THEMES}>
//         {(theme) => (
//           <SelectItem value={theme} onClick={() => setShikiTheme(theme)}>
//             {theme}
//           </SelectItem>
//         )}
//       </For>
//     </Select>
//   );
// }

function ModeSwitcher() {
  return (
    <Select
      aria-label="Modes"
      value={mode()}
      onValueChange={setMode}
      placeholder="Select a mode"
    >
      <For each={MODES}>
        {(mode) => (
          <SelectItem value={mode} onClick={() => setMode(mode)}>
            {mode}
          </SelectItem>
        )}
      </For>
    </Select>
  );
}

export function Header() {
  return (
    <div class="flex h-20 items-center justify-between border-b-2 border-secondary px-8">
      <h1 class="flex items-center">
        <img src={AstroLogo} class="h-14" />
        <FaSolidGears />
        <span class="text-3xl font-extrabold text-white">Live Compiler</span>
      </h1>
      <span class="flex items-center gap-5">
        <ModeSwitcher />
        <WordWrapToggle />
        {/* <ThemeSwitcher /> */}
      </span>
    </div>
  );
}

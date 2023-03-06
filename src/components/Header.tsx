import { FaSolidGears } from "solid-icons/fa";
import { HiOutlineSelector } from "solid-icons/hi";
import AstroLogo from "~/assets/astro-logo.svg";

import { For, createEffect } from "solid-js";
import { Select as SelectPrimitive } from "@kobalte/core";
import { mode, setMode, setShikiTheme, shikiTheme } from "../lib/store";

import { type ComponentProps, splitProps } from "solid-js";
import { AiOutlineCheck } from "solid-icons/ai";
import { DARK_THEMES, MODES } from "~/lib/consts";

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
    <SelectPrimitive.Root value={shikiTheme()} {...others}>
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

function ThemeSwitcher() {
  return (
    <Select
      aria-label="Themes"
      value={shikiTheme()}
      onValueChange={setShikiTheme}
      placeholder="Select a theme"
    >
      <For each={DARK_THEMES}>
        {(theme) => (
          <SelectItem value={theme} onClick={() => setShikiTheme(theme)}>
            {theme}
          </SelectItem>
        )}
      </For>
    </Select>
  );
}

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
    <div class="flex h-20 items-center justify-between border-b-2 border-secondary bg-primary px-8">
      <h1 class="flex items-center">
        <img src={AstroLogo} class="h-16" />
        <FaSolidGears />
        <span class="text-3xl font-extrabold text-white">Live Compiler</span>
      </h1>
      <span>
        <ModeSwitcher />
        <ThemeSwitcher />
      </span>
    </div>
  );
}

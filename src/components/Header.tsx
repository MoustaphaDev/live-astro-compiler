import { FaSolidGears } from "solid-icons/fa";
import { HiOutlineSelector } from "solid-icons/hi";
import AstroLogo from "~/assets/astro-logo.svg";

import { For } from "solid-js";
import { Select } from "@kobalte/core";

import { ComponentProps, splitProps } from "solid-js";
import { AiOutlineCheck } from "solid-icons/ai";

export function SelectItem(props: ComponentProps<typeof Select.Item>) {
  const [local, others] = splitProps(props, ["children"]);
  return (
    <Select.Item class="select__item" {...others}>
      <Select.ItemLabel>{local.children}</Select.ItemLabel>
      <Select.ItemIndicator class="select__item-indicator">
        <AiOutlineCheck />
      </Select.ItemIndicator>
    </Select.Item>
  );
}

function ThemeSwitcher() {
  return (
    <Select.Root value={"Test"} onValueChange={() => {}}>
      <Select.Trigger class="select__trigger" aria-label="Themes">
        <Select.Value class="select__value" placeholder="Select a theme" />
        <Select.Icon class="select__icon">
          <HiOutlineSelector />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content class="select__content">
          <Select.Listbox class="select__listbox">
            <For each={["Nord", "Vitesse"]}>
              {(theme) => <SelectItem value={theme}>{theme}</SelectItem>}
            </For>
          </Select.Listbox>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

export function Header() {
  return (
    <div class="border-secondary bg-primary flex h-20 items-center justify-between border-b-2 px-8">
      <h1 class="flex items-center">
        <img src={AstroLogo} class="h-16" />
        <FaSolidGears />
        <span class="text-3xl font-extrabold text-white">Live Compiler</span>
      </h1>
      <ThemeSwitcher />
    </div>
  );
}

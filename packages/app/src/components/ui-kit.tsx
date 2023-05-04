import { type ComponentProps, type JSX, splitProps } from "solid-js";
import {
  Select as SelectPrimitive,
  Separator as SeparatorPrimitive,
  ToggleButton as ToggleButtonPrimitive,
} from "@kobalte/core";
import { TextField as TextFieldPrimitive } from "@kobalte/core";
import { BsCheckCircleFill } from "solid-icons/bs";
import { HiOutlineSelector } from "solid-icons/hi";

type ToggleFieldProps = ComponentProps<"div"> & {
  label: string;
};
export function ToggleField(props: ToggleFieldProps) {
  const [local, others] = splitProps(props, ["children", "class", "label"]);
  return (
    <div
      class={`flex items-center justify-between rounded border-secondary py-4 font-fira-code ${
        local.class ?? ""
      }`}
      {...others}
    >
      <p class="select-none text-sm font-medium text-zinc-400">{local.label}</p>
      {local.children}
    </div>
  );
}

type ButtonToggleProps = ComponentProps<typeof ToggleButtonPrimitive.Root> & {
  children: JSX.Element;
};
export function ToggleButton(props: ButtonToggleProps) {
  const [local, others] = splitProps(props, ["children", "class"]);
  return (
    <ToggleButtonPrimitive.Root
      class={`box-content h-10 w-[calc(theme(spacing.8)*3)] rounded-full border border-solid border-secondary bg-primary leading-none text-white outline-none ring-offset-0 ring-offset-primary transition-all duration-[250ms,color] hover:border-accent-2 hover:bg-black/5 focus:ring-2 focus:ring-accent-2 ${
        local.class ?? ""
      }`}
      {...others}
    >
      <span
        class={`ml-1 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
          others.isPressed
            ? "translate-x-[calc(200%-theme(spacing.2))] bg-accent-2 text-secondary"
            : "bg-secondary"
        }`}
      >
        {local.children}
      </span>
    </ToggleButtonPrimitive.Root>
  );
}

type TextFieldProps = ComponentProps<typeof TextFieldPrimitive.Root> & {
  placeholder: string;
};
export function TextField(props: TextFieldProps) {
  const [local, others] = splitProps(props, [
    "children",
    "class",
    "placeholder",
  ]);
  return (
    <TextFieldPrimitive.Root
      class={`flex flex-col justify-between rounded border-secondary py-4 font-fira-code sm:flex-row sm:items-center ${
        local.class ?? ""
      }`}
      {...others}
    >
      <TextFieldPrimitive.Label class="select-none text-sm font-medium text-zinc-400">
        {local.children}
      </TextFieldPrimitive.Label>
      <TextFieldPrimitive.Input
        placeholder={local.placeholder}
        class="mt-2 inline-flex w-full rounded-md bg-primary/50 bg-zinc-900 px-3 py-2 text-sm text-zinc-600 outline-none transition-all duration-[250ms,color] placeholder:text-zinc-700 hover:bg-zinc-900/80 hover:ring-1 hover:ring-secondary focus:bg-zinc-900/80 focus-visible:ring-1 focus-visible:ring-accent-2/50 data-[invalid]:border-[hsl(0_72%_51%)] data-[invalid]:text-[hsl(0_72%_51%)] sm:mt-0 sm:w-[200px] sm:py-1.5"
      />
      {/* <TextFieldPrimitive.Description class="text-zinc-700 text-xs select-none" /> */}
      {/* <TextFieldPrimitive.ErrorMessage class="text-[hsl(0_72%_51%)] text-xs select-none" /> */}
    </TextFieldPrimitive.Root>
  );
}

export function SelectItem(props: ComponentProps<typeof SelectPrimitive.Item>) {
  const [local, others] = splitProps(props, ["children"]);
  return (
    <SelectPrimitive.Item class="select__item cursor-pointer" {...others}>
      <SelectPrimitive.ItemLabel class="capitalize">
        {local.children}
      </SelectPrimitive.ItemLabel>
      <SelectPrimitive.ItemIndicator class="select__item-indicator">
        <BsCheckCircleFill />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export function Select(
  props: ComponentProps<typeof SelectPrimitive.Root> & {
    "aria-label": string;
    placeholder: string;
    class?: string;
  }
) {
  const [local, others] = splitProps(props, [
    "children",
    "placeholder",
    "class",
  ]);
  return (
    <SelectPrimitive.Root {...others}>
      <SelectPrimitive.Trigger
        class={`inline-flex h-8 w-[100px] items-center justify-between rounded-md border border-solid border-secondary bg-primary py-0 pl-4 pr-2.5 text-sm capitalize leading-none text-zinc-200 outline-none ring-offset-2 ring-offset-primary transition-shadow duration-[250ms,color] hover:border-accent-2/50 hover:bg-accent-2/10 focus:ring-2 focus:ring-accent-2 data-[invalid]:border-[hsl(0_72%_51%)]  data-[invalid]:text-[hsl(0_72%_51%)] lg:h-10 lg:w-[200px] lg:text-sm ${
          local.class ?? ""
        }`}
        aria-label="Themes"
      >
        <SelectPrimitive.Value
          class="overflow-hidden text-ellipsis whitespace-nowrap data-[placeholder-shown]:text-zinc-500"
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

export function Separator() {
  return (
    <SeparatorPrimitive.Root
      data-orientation="horizontal"
      class="h-[3px] border-none data-[orientation=horizontal]:bg-zinc-900"
    />
  );
}

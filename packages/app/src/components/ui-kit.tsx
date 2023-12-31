import {
  type ComponentProps,
  type JSX,
  splitProps,
  For,
  Signal,
  createSelector,
  Accessor,
} from "solid-js";
import {
  Separator as SeparatorPrimitive,
  ToggleButton as ToggleButtonPrimitive,
  TextField as TextFieldPrimitive,
  RadioGroup,
} from "@kobalte/core";
import { toast } from "solid-sonner";
import type { PersistentSignal } from "~/lib/stores/utils";
import { createMemo } from "solid-js";

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
  children?: JSX.Element;
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
          others.pressed
            ? "translate-x-[calc(200%-theme(spacing.2))] bg-accent-2 text-secondary"
            : "bg-secondary"
        }`}
      >
        {local.children ?? null}
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
    </TextFieldPrimitive.Root>
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

type SegmentedButtonProps<
  T extends string[],
  U extends T = [...T],
  K extends string = U[number],
> = {
  options: U;
  activeClass?: string;
  activeOption?: K;
  isMobile?: boolean;
  handleOptionChange?: (option: K) => void;
};
export function SegmentedButton<T extends string[] = string[]>(
  props: SegmentedButtonProps<T>,
) {
  return (
    <RadioGroup.Root
      value={props.activeOption}
      onChange={props.handleOptionChange}
      class="inline-flex divide-x divide-zinc-600 overflow-hidden rounded-md border border-solid border-secondary text-base capitalize leading-none outline-none ring-offset-2 ring-offset-primary transition-all duration-[250ms,color] focus-within:outline-offset-2 focus-within:outline-accent-2 focus-within:ring-2 focus-within:ring-accent-2 [&_*]:select-none"
      classList={{
        "lg:hidden": props.isMobile,
      }}
    >
      <For each={props.options}>
        {(option) => (
          <RadioGroup.Item value={option} class="cursor-pointer">
            <RadioGroup.ItemInput />
            <RadioGroup.ItemControl
              class="px-6 py-3 text-zinc-200 transition-colors"
              classList={{
                [props.activeOption === option
                  ? props.activeClass ?? "bg-zinc-800"
                  : "bg-zinc-900/50"]: true,
              }}
            >
              <RadioGroup.ItemLabel class="block h-full w-full cursor-pointer">
                {option}
              </RadioGroup.ItemLabel>
            </RadioGroup.ItemControl>
          </RadioGroup.Item>
        )}
      </For>
    </RadioGroup.Root>
    // just keeping this here if I wanna go back to it fast
    // <div
    //   classList={
    //     /*@once*/ {
    //       "overflow-hidden w-min appearance-none items-center justify-center divide-x divide-zinc-600 rounded-md border border-solid border-secondary text-base capitalize leading-none outline-none ring-offset-2 ring-offset-primary transition-all  duration-[250ms,color] hover:ring-offset-0 focus-visible:outline-offset-2 focus-visible:outline-accent-2  focus-visible:ring-2 [&_*]:select-none ":
    //         true,
    //       "inline-flex lg:hidden": props.isMobile,
    //       "inline-flex": !props.isMobile,
    //     }
    //   }
    // >
    //   <For each={props.options}>
    //     {(option) => (
    //       <Button.Root
    //         onClick={() => {
    //           props?.handleOptionChange?.(option);
    //         }}
    //         class={`px-4 py-2 text-zinc-200 transition-opacity duration-200 ${
    //           props.activeOption === option
    //             ? props.activeClass ?? "bg-zinc-900"
    //             : "bg-zinc-900 opacity-50"
    //         }`}
    //       >
    //         {option}
    //       </Button.Root>
    //     )}
    //   </For>
    // </div>
  );
}

type TabsListProps<
  T extends readonly string[] | string[],
  U extends T = [...T],
  K extends string = U[number],
> = {
  readonly items: T;
  signal: PersistentSignal<K> | Signal<K>;
  onChange?: (item: K) => void;
  refineLabel?: (title: K) => string;
};
export function TabsList<T extends readonly string[] | string[]>(
  props: TabsListProps<T>,
) {
  const [getter, setter] = props.signal;
  const isSelected = createSelector(getter);
  // get rid of `any` types latter
  const clickHandler = (item: any) => {
    setter(() => item);
    props.onChange?.(item);
  };

  return (
    <For each={props.items}>
      {(item) => {
        const label = props.refineLabel?.(item) ?? item;
        console.log("RENDER!!!!");
        return (
          <button
            onClick={() => clickHandler(item)}
            classList={{
              "relative capitalize py-4 inline-block outline-none w-min px-4 text-sm focus-visible:after:content-[''] focus-visible:after:h-1 focus-visible:bg-zinc-900 focus-visible:after:bottom-0 focus-visible:after:absolute focus-visible:after:w-full focus-visible:after:left-0 hover:bg-zinc-900/50":
                true,
              [!isSelected(item)
                ? "text-zinc-200 focus-visible:after:bg-zinc-700"
                : "text-accent-2"]: true,
              "after:content-[''] after:h-1 after:bottom-0 after:absolute after:w-full after:left-0 after:bg-accent-2 text-accent-2 rounded-t":
                isSelected(item),
            }}
          >
            {label}
          </button>
        );
      }}
    </For>
  );
}

export function LoadingEditor() {
  return (
    <div class="z-50 flex h-full w-full items-center justify-center bg-primary">
      <div class="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-white"></div>
    </div>
  );
}

export function LoadingError() {
  toast.error("An error occured, please refresh the page.");
  return (
    <div class="flex h-full w-full items-center justify-center bg-primary">
      <div class="text-4xl font-bold text-red-600">X</div>
    </div>
  );
}

/**
 reduces the amount of re-renders in conditionally rendered components
*/
export function createJSXMemo<T extends JSX.Element>(jsx: T): Accessor<T> {
  return createMemo(() => jsx);
}

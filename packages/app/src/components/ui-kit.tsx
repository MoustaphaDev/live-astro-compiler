import {
  type ComponentProps,
  type JSX,
  splitProps,
  For,
  createSignal,
} from "solid-js";
import {
  Separator as SeparatorPrimitive,
  ToggleButton as ToggleButtonPrimitive,
  TextField as TextFieldPrimitive,
  Button,
} from "@kobalte/core";

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
  defaultActive?: K;
  isMobile?: boolean;
  handleOptionChange?: (option: K) => void;
};
export function SegmentedButton<T extends string[] = string[]>(
  props: SegmentedButtonProps<T>,
) {
  const [activeOption, setActiveOption] = createSignal(
    props.defaultActive ?? props.options[0],
  );
  // this is to rearrange the default active option to be the first option
  const options = props.options.filter((option) => option !== activeOption());
  options.unshift(activeOption());
  return (
    <div
      classList={
        /*@once*/ {
          "focus-visible::ring-accent-2 overflow-hidden w-min appearance-none items-center justify-center divide-x divide-zinc-600 rounded-md border border-solid border-secondary text-base capitalize leading-none outline-none ring-offset-2 ring-offset-primary transition-all  duration-[250ms,color] hover:ring-offset-0 focus-visible:outline-offset-2 focus-visible:outline-accent-2  focus-visible:ring-2 [&_*]:select-none ":
            true,
          "inline-flex lg:hidden": props.isMobile,
          "inline-flex": !props.isMobile,
        }
      }
    >
      <For each={props.options}>
        {(option) => (
          <Button.Root
            onClick={() => {
              // @ts-expect-error
              setActiveOption(option);
              props?.handleOptionChange?.(option);
            }}
            class={`px-4 py-2 text-zinc-200 transition-opacity duration-200 ${
              activeOption() === option
                ? props.activeClass ?? "bg-zinc-900"
                : "bg-zinc-900 opacity-50"
            }`}
          >
            {option}
          </Button.Root>
        )}
      </For>
    </div>
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
  return (
    <div class="flex h-full w-full items-center justify-center bg-primary">
      <div class="text-4xl font-bold text-red-600">X</div>
    </div>
  );
}

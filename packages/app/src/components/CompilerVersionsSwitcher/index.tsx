import { Button } from "@kobalte/core";
import { type Accessor, For, Show, Suspense, createSelector } from "solid-js";
import { currentCompilerVersion } from "~/lib/stores";
import { SegmentedButton } from "../ui-kit";
import type { SettingsSectionProps } from "../Settings";
import { VsRefresh } from "solid-icons/vs";
import { useVersionsList, useVersionsSwitcher } from "./hooks";
import { listContainerRefPointer } from "./utils";

export type VersionSwitcherProps = SettingsSectionProps;
// TODO: consider refactoring this component to use the context api
export function CompilerVersionSwitcher(props: VersionSwitcherProps) {
  const vs = useVersionsSwitcher(props);
  return (
    <div>
      <div class="flex flex-row items-center justify-between">
        <div class="flex items-center justify-center gap-5">
          <h3
            class="font-semibold text-white transition-colors"
            data-top-most-element-in-modal-content
          >
            Versions
          </h3>
          <RefreshButton
            listRefetcher={vs.listRefetcher}
            loading={vs.isLoadingCompilerVersions()}
          />
        </div>
        <SegmentedButton
          activeClass="[&[data-checked]]:bg-accent-2 !text-primary !font-semibold"
          options={["Production", "Preview"]}
          activeOption={vs.versionsType()}
          handleOptionChange={vs.handleVersionTypeChange}
        />
      </div>
      <Suspense fallback={<VersionListSqueleton />}>
        <VersionsList
          setCategorizedCompilerVersions={vs.setCategorizedCompilerVersions}
          versionsType={vs.versionsType}
          numberOfProductionVersionsToDisplay={
            vs.numberOfProductionVersionsToDisplay
          }
          numberOfPreviewVersionsToDisplay={vs.numberOfPreviewVersionsToDisplay}
          compilerVersionChangeHandler={vs.handleCompilerVersionChange}
          setListRefetcher={vs.setListRefetcher}
          setIsLoading={vs.setIsLoadingCompilerVersions}
        />
      </Suspense>
      <div class="flex items-center justify-center">
        <Show when={typeof vs.categorizedCompilerVersions() !== "undefined"}>
          <Button.Root
            onClick={vs.handleShowMore}
            disabled={vs.isLoadingCompilerVersions()}
            class="rounded-md bg-zinc-900 px-3 py-2 text-zinc-50 outline-none ring-offset-0 ring-offset-primary transition-colors duration-[250ms,color] hover:bg-zinc-700 focus:ring-2 focus:ring-accent-2"
            classList={{
              "cursor-not-allowed": vs.isLoadingCompilerVersions(),
            }}
          >
            Show more
          </Button.Root>
        </Show>
      </div>
    </div>
  );
}

export type VersionsListProps = {
  versionsType: () => "Preview" | "Production";
  compilerVersionChangeHandler: (version: string) => void;
  numberOfProductionVersionsToDisplay: Accessor<number>;
  numberOfPreviewVersionsToDisplay: Accessor<number>;
  setCategorizedCompilerVersions: (value: any) => void;
  setListRefetcher: (refetcher: () => void) => void;
  setIsLoading: (value: boolean) => void;
};
function VersionsList(props: VersionsListProps) {
  const vl = useVersionsList(props);
  const isSelected = createSelector(currentCompilerVersion);
  const title = (version: string) =>
    isSelected(version) ? `Compiler v${version}` : `Load compiler v${version}`;
  return (
    <div
      classList={{
        "blur-[2px] pointer-events-none relative":
          vl.allCompilerVersions.loading,
      }}
    >
      <ScrollShadow ref={vl.shadowRelatedRefs.shadowTopRef!} position="top" />
      <div
        class="relative h-80 overflow-y-auto px-1 py-4"
        ref={listContainerRefPointer.current!}
      >
        <div
          class="absolute"
          ref={vl.shadowRelatedRefs.pixelToObserveTop!}
        ></div>
        <div class="flex flex-wrap content-start gap-x-4 gap-y-4">
          <For each={vl.versionsToDisplay()}>
            {(version) => {
              return (
                <Button.Root
                  title={title(version)}
                  aria-label={title(version)}
                  data-selected-compiler-button={isSelected(version) || void 0}
                  onClick={() => props.compilerVersionChangeHandler(version)}
                  class="h-min max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-3 py-2 outline-none ring-offset-0 ring-offset-primary transition-all duration-[250ms,color] focus:ring-2 focus:ring-accent-2"
                  classList={{
                    [isSelected(version)
                      ? "text-primary bg-zinc-300 font-semibold cursor-default"
                      : "bg-[#222] text-zinc-600 hover:text-zinc-200 focus:text-zinc-200"]:
                      true,
                  }}
                  disabled={isSelected(version)}
                >
                  {version}
                </Button.Root>
              );
            }}
          </For>
        </div>
        <div
          class="absolute"
          ref={vl.shadowRelatedRefs.pixelToObserveBottom!}
        ></div>
      </div>
      <ScrollShadow
        ref={vl.shadowRelatedRefs.shadowBottomRef!}
        position="bottom"
      />
    </div>
  );
}

type ScrollShadowProps = {
  ref: HTMLDivElement;
  position: "top" | "bottom";
};
function ScrollShadow(props: ScrollShadowProps) {
  const translate =
    props.position === "top" ? "translate-y-10" : "-translate-y-10";
  const resolvedPosition = props.position === "top" ? "top-0" : "bottom-0";
  const weightDefinition =
    props.position === "top" ? "[--weight:1]" : "[--weight:-1]";
  return (
    <div
      class="versions-list-shadow pointer-events-none relative left-0 z-10 h-10 w-full transition-shadow"
      classList={{
        [translate]: true,
        [resolvedPosition]: true,
        [weightDefinition]: true,
      }}
      ref={props.ref}
    ></div>
  );
}

type RefreshButtonProps = {
  listRefetcher: ReturnType<typeof useVersionsSwitcher>["listRefetcher"];
  loading: boolean;
};
function RefreshButton(props: RefreshButtonProps) {
  const handleRefresh = () => {
    props.listRefetcher()();
  };
  return (
    <Button.Root
      onClick={handleRefresh}
      class="outline-none ring-offset-0 ring-offset-primary transition-all duration-[250ms,color] focus-visible:ring-2 focus-visible:ring-accent-2 [&_svg]:focus-visible:text-accent-2"
    >
      <div class="flex items-center justify-center">
        <VsRefresh
          size={30}
          title="Refresh the list of compiler versions"
          classList={{
            "text-secondary transition-colors origin-center hover:text-accent-2":
              true,
            "motion-safe:animate-spin": props.loading,
          }}
        />
      </div>
    </Button.Root>
  );
}

function VersionListSqueleton() {
  return (
    <div
      class="mb-10 mt-10 h-80 w-full animate-pulse rounded-2xl bg-secondary"
      title="Loading the list of compiler versions..."
      aria-label="Loading the list of compiler versions..."
    ></div>
  );
}

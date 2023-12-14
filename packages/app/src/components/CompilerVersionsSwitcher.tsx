import { Button } from "@kobalte/core";
import {
  type Accessor,
  For,
  Show,
  Suspense,
  createComputed,
  createMemo,
  createResource,
  createSignal,
  on,
  createEffect,
  onMount,
} from "solid-js";
import { compilerVersionFetcher } from "~/lib/compiler/fetch";
import {
  getDefaultCompilerVersionToLoad,
  setCompiler,
} from "~/lib/compiler/module";
import { getCompilerVersionsByType } from "~/lib/compiler/utils";
import { setCurrentCompilerVersion } from "~/lib/stores";
import { SegmentedButton } from "./ui-kit";
import { SettingsSectionProps } from "./Settings";
import { VsRefresh } from "solid-icons/vs";

type VersionSwitcherProps = SettingsSectionProps;
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
            loading={vs.loading()}
          />
        </div>
        <SegmentedButton
          activeClass="bg-accent-2 !text-primary !font-semibold"
          options={["Preview", "Production"]}
          defaultActive={/*@once*/ vs.versionsType()}
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
          setIsLoading={vs.setIsLoading}
        />
      </Suspense>
      <div class="flex items-center justify-center">
        <Show when={typeof vs.categorizedCompilerVersions() !== "undefined"}>
          <Button.Root
            onClick={vs.handleShowMore}
            disabled={vs.loading()}
            class="rounded-md bg-zinc-900 px-3 py-2 text-zinc-50 outline-none ring-offset-0 ring-offset-primary transition-colors duration-[250ms,color] hover:bg-zinc-700 focus:ring-2 focus:ring-accent-2"
            classList={{
              "cursor-not-allowed": vs.loading(),
            }}
          >
            Show more
          </Button.Root>
        </Show>
      </div>
    </div>
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

type VersionsListProps = {
  versionsType: () => "Preview" | "Production";
  compilerVersionChangeHandler: (version: string) => void;
  numberOfProductionVersionsToDisplay: Accessor<number>;
  numberOfPreviewVersionsToDisplay: Accessor<number>;
  setCategorizedCompilerVersions: (value: any) => void;
  setListRefetcher: (refetcher: () => void) => void;
  setIsLoading: (value: boolean) => void;
};
function VersionsList(props: VersionsListProps) {
  const { allCompilerVersions, versionsToDisplay } = useVersionsList(props);
  let pixelToObserveTop: HTMLDivElement | null = null;
  let pixelToObserveBottom: HTMLDivElement | null = null;

  let shadowTopRef: HTMLDivElement | null = null;
  let shadowBottomRef: HTMLDivElement | null = null;
  onMount(() => {
    const topObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          shadowTopRef!.classList.remove("opacity-0");
          console.log("intersecting");
        } else {
          shadowTopRef!.classList.add("opacity-0");
          console.log("not intersecting");
        }
      },
      { root: listContainerRef! },
    );
    topObserver.observe(pixelToObserveTop!);

    const bottomObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          shadowBottomRef!.classList.remove("opacity-0");
        } else {
          shadowBottomRef!.classList.add("opacity-0");
        }
      },
      { root: listContainerRef! },
    );
    bottomObserver.observe(pixelToObserveBottom!);
  });

  return (
    <div
      classList={{
        "blur-[2px] pointer-events-none": allCompilerVersions.loading,
      }}
    >
      <ScrollShadow ref={shadowTopRef!} position="top" />
      <div
        class="relative h-80 overflow-y-auto px-1 py-4"
        ref={listContainerRef!}
      >
        <div class="absolute" ref={pixelToObserveTop!}></div>
        <div class="flex flex-wrap content-start gap-x-4 gap-y-4">
          <For each={versionsToDisplay()}>
            {(version) => {
              return (
                <Button.Root
                  onClick={() => props.compilerVersionChangeHandler(version)}
                  class="h-min w-fit bg-[#222] px-3 py-2 text-zinc-600 outline-none ring-offset-0 ring-offset-primary transition-all duration-[250ms,color] hover:text-zinc-200 focus:text-zinc-200 focus:ring-2 focus:ring-accent-2"
                >
                  {version}
                </Button.Root>
              );
            }}
          </For>
        </div>
        <div class="absolute" ref={pixelToObserveBottom!}></div>S
      </div>
      <ScrollShadow ref={shadowBottomRef!} position="bottom" />
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
      class="versions-list-shadow pointer-events-none sticky left-0 z-10 h-10 w-full"
      classList={{
        [translate]: true,
        [resolvedPosition]: true,
        [weightDefinition]: true,
      }}
      ref={props.ref}
    ></div>
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

function useVersionsSwitcher(props: VersionSwitcherProps) {
  const STEP = 5;
  const INITIAL_NUMBER_OF_PRODUCTION_VERSIONS_TO_DISPLAY = 30;
  const INITIAL_NUMBER_OF_PREVIEW_VERSIONS_TO_DISPLAY = 10;
  const [versionsType, setVersionsType] = createSignal<
    "Preview" | "Production"
  >("Production");
  const [
    numberOfProductionVersionsToDisplay,
    setNumberOfProductionVersionsToDisplay,
  ] = createSignal(INITIAL_NUMBER_OF_PRODUCTION_VERSIONS_TO_DISPLAY);
  const [
    numberOfPreviewVersionsToDisplay,
    setNumberOfPreviewVersionsToDisplay,
  ] = createSignal(INITIAL_NUMBER_OF_PREVIEW_VERSIONS_TO_DISPLAY);
  const [categorizedCompilerVersions, setCategorizedCompilerVersions] =
    createSignal<ReturnType<typeof getCompilerVersionsByType>>();

  const [listRefetcher, setListRefetcher] = createSignal(() => () => {});
  const [isLoading, setIsLoading] = createSignal(false);

  const handleShowMore = () => {
    if (versionsType() === "Preview") {
      // don't show more than the total number of preview versions
      setNumberOfPreviewVersionsToDisplay((prev) =>
        Math.min(
          prev + STEP,
          categorizedCompilerVersions()!.previewVersions?.length,
        ),
      );
    } else {
      setNumberOfProductionVersionsToDisplay((prev) =>
        Math.min(
          prev + STEP,
          categorizedCompilerVersions()!.productionVersions.length,
        ),
      );
    }

    scrollToBottom();
  };

  const handleVersionTypeChange = (type: "Preview" | "Production") => {
    setVersionsType(type);
    scrollToTop();
  };

  const handleCompilerVersionChange = createCompilerChangeHandler(
    props.closeModal,
  );
  return {
    categorizedCompilerVersions,
    setCategorizedCompilerVersions,
    handleShowMore,
    handleCompilerVersionChange,
    handleVersionTypeChange,
    setVersionsType,
    versionsType,
    numberOfProductionVersionsToDisplay,
    numberOfPreviewVersionsToDisplay,
    setListRefetcher,
    listRefetcher,
    setIsLoading,
    loading: isLoading,
  };
}

function useVersionsList(props: VersionsListProps) {
  const [allCompilerVersions, { refetch }] = createResource(
    compilerVersionFetcher,
  );
  const categorizedCompilerVersions = createMemo(() => {
    return getCompilerVersionsByType(allCompilerVersions.latest ?? []);
  });

  const productionVersionsToDisplay = createMemo(() => {
    return categorizedCompilerVersions().productionVersions.slice(
      0,
      props.numberOfProductionVersionsToDisplay(),
    );
  });

  const previewVersionsToDisplay = createMemo(() => {
    return categorizedCompilerVersions().previewVersions.slice(
      0,
      props.numberOfPreviewVersionsToDisplay(),
    );
  });

  // TODO: hiding and showing the corresponding versions when switching from one
  // type to another instead of unmounting them and remounting them should be
  // more performant. Refactor this later
  const versionsToDisplay = createMemo(() => {
    if (props.versionsType() === "Preview") {
      return previewVersionsToDisplay();
    }
    return productionVersionsToDisplay();
  });

  createEffect(() => {
    props.setCategorizedCompilerVersions(categorizedCompilerVersions());
  });
  createComputed(() => {
    props.setIsLoading(allCompilerVersions.loading);
  });
  createComputed(
    on(refetch, () => {
      props.setListRefetcher(() => refetch);
    }),
  );

  return {
    allCompilerVersions,
    versionsToDisplay,
  };
}

function createCompilerChangeHandler(
  afterCompilerChange: () => Promise<void> | void,
) {
  return (version: string) => {
    // setHasCompilerVersionChangeBeenHandled(false);
    setCompiler(version).then(async ({ status }) => {
      if (status === "failure") {
        const { compilerVersionToLoad: fallbackCompilerVersion } =
          await getDefaultCompilerVersionToLoad();
        // TODO: display a toast to the user
        alert(
          `An error occured while loading the compiler, falling back to v${fallbackCompilerVersion}`,
        );
        // TODO: handle failure here too
        await setCompiler(fallbackCompilerVersion);
        version = fallbackCompilerVersion;

        if (!version) {
          throw new Error("No fallback compiler version was found");
        }
      }
      setCurrentCompilerVersion(version);
      // setHasCompilerVersionChangeBeenHandled(true);
      await afterCompilerChange();
    });
  };
}

let listContainerRef: HTMLDivElement | null = null;
let prevVersionListScrollDifference: number = 0;
function scrollToBottom() {
  if (listContainerRef) {
    const scrollDifference =
      -listContainerRef.clientHeight + listContainerRef.scrollHeight;
    if (prevVersionListScrollDifference === scrollDifference) return;
    listContainerRef.scrollTo({
      top: listContainerRef.scrollHeight,
      behavior: "smooth",
    });
    prevVersionListScrollDifference = scrollDifference;
  }
}

function scrollToTop() {
  if (listContainerRef && listContainerRef.scrollTop !== 0) {
    listContainerRef.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

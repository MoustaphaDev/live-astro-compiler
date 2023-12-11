import { Button } from "@kobalte/core";
import { IoRefreshCircle } from "solid-icons/io";
import {
  type Accessor,
  For,
  Show,
  Suspense,
  createComputed,
  createMemo,
  createResource,
  createSignal,
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

type VersionSwitcherProps = SettingsSectionProps;
// TODO: consider refactoring this component to use the context api
export function CompilerVersionSwitcher(props: VersionSwitcherProps) {
  const vs = useVersionsSwitcher(props);
  return (
    <div>
      <div
        classList={{
          "flex flex-row items-center justify-between": true,
          // "bg-red-700": pending(),
        }}
      >
        <h3 class="text-md font-semibold leading-none text-white">Versions</h3>
        <div class="flex items-center justify-around gap-5">
          <Button.Root onClick={() => vs.listRefetcher()}>
            <IoRefreshCircle
              color="red"
              class="h-10 w-10 text-zinc-900 hover:text-accent-2"
            />
          </Button.Root>
          <SegmentedButton
            activeClass="bg-accent-2 !text-primary !font-semibold"
            options={["Preview", "Production"]}
            defaultActive={/*@once*/ vs.versionsType()}
            handleOptionChange={vs.setVersionsType}
          />
        </div>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <VersionsList
          setCategorizedCompilerVersions={vs.setCategorizedCompilerVersions}
          versionsType={vs.versionsType}
          numberOfProductionVersionsToDisplay={
            vs.numberOfProductionVersionsToDisplay
          }
          numberOfPreviewVersionsToDisplay={vs.numberOfPreviewVersionsToDisplay}
          compilerVersionChangeHandler={vs.handleCompilerVersionChange}
          setListRefetcher={vs.setListRefetcher}
        />
      </Suspense>
      <div class="flex items-center justify-center">
        <Show when={typeof vs.categorizedCompilerVersions() !== "undefined"}>
          <Button.Root
            onClick={vs.handleShowMore}
            class="bg-zinc-700 px-3 py-2 text-zinc-50"
          >
            Show more
          </Button.Root>
        </Show>
      </div>
    </div>
  );
}

type VersionsListProps = {
  versionsType: () => "Preview" | "Production";
  compilerVersionChangeHandler: (version: string) => void;
  numberOfProductionVersionsToDisplay: Accessor<number>;
  numberOfPreviewVersionsToDisplay: Accessor<number>;
  setCategorizedCompilerVersions: (value: any) => void;
  setListRefetcher: (refetcher: () => void) => void;
};
function VersionsList(props: VersionsListProps) {
  const { allCompilerVersions, versionsToDisplay } = useVersionsList(props);
  return (
    <div
      classList={{
        "mb-10 mt-10 flex h-56 flex-wrap gap-x-8 gap-y-8 overflow-y-auto": true,
        "bg-red-600": allCompilerVersions.loading,
      }}
    >
      <For each={versionsToDisplay()}>
        {(version) => {
          return (
            <Button.Root
              onClick={() => props.compilerVersionChangeHandler(version)}
              class="bg-[#222] px-3 py-2 text-zinc-100"
            >
              {version}
            </Button.Root>
          );
        }}
      </For>
    </div>
  );
}

function useVersionsSwitcher(props: VersionSwitcherProps) {
  const STEP = 5;
  const INITIAL_NUMBER_OF_VERSIONS_TO_DISPLAY = 10;
  const [versionsType, setVersionsType] = createSignal<
    "Preview" | "Production"
  >("Production");
  const [
    numberOfProductionVersionsToDisplay,
    setNumberOfProductionVersionsToDisplay,
  ] = createSignal(INITIAL_NUMBER_OF_VERSIONS_TO_DISPLAY);
  const [
    numberOfPreviewVersionsToDisplay,
    setNumberOfPreviewVersionsToDisplay,
  ] = createSignal(INITIAL_NUMBER_OF_VERSIONS_TO_DISPLAY);
  const [categorizedCompilerVersions, setCategorizedCompilerVersions] =
    createSignal<ReturnType<typeof getCompilerVersionsByType>>();

  let listRefetcher: () => void = () => {};
  const setListRefetcher = (refetcher: () => void) => {
    listRefetcher = refetcher;
  };

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
  };

  const handleCompilerVersionChange = createCompilerChangeHandler(
    props.closeModal,
  );
  return {
    categorizedCompilerVersions,
    setListRefetcher,
    handleShowMore,
    handleCompilerVersionChange,
    versionsType,
    setVersionsType,
    numberOfProductionVersionsToDisplay,
    numberOfPreviewVersionsToDisplay,
    setCategorizedCompilerVersions,
    listRefetcher,
  };
}

function useVersionsList(props: VersionsListProps) {
  const [allCompilerVersions, { refetch }] = createResource(
    compilerVersionFetcher,
  );

  const categorizedCompilerVersions = createMemo(() => {
    return getCompilerVersionsByType(allCompilerVersions.latest ?? []);
  });

  createComputed(() => {
    props.setCategorizedCompilerVersions(categorizedCompilerVersions());
    props.setListRefetcher(refetch);
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

  const versionsToDisplay = createMemo(() => {
    if (props.versionsType() === "Preview") {
      return previewVersionsToDisplay();
    }
    return productionVersionsToDisplay();
  });
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

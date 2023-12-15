import {
  createComputed,
  createMemo,
  createResource,
  createSignal,
  on,
  createEffect,
  onMount,
  untrack,
} from "solid-js";
import { compilerVersionFetcher } from "~/lib/compiler/fetch";
import {
  getCompilerVersionsByType,
  isPreviewVersion,
} from "~/lib/compiler/utils";
import {
  currentCompilerVersion,
  setCurrentCompilerVersion,
} from "~/lib/stores";
import { createRenderEffect } from "solid-js";
import {
  createCompilerChangeHandler,
  listContainerRefPointer,
  scrollToBottom,
  scrollToSelectedVersion,
  scrollToTop,
} from "./utils";
import { VersionSwitcherProps, VersionsListProps } from ".";

// TODO: refactor this later, code looks sooooo ugly
// and all over the place xD
export function useVersionsSwitcher(props: VersionSwitcherProps) {
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
  const [isLoadingCompilerVersions, setIsLoadingCompilerVersions] =
    createSignal(false);

  // this effect is responsible for increasing the number of versions to display
  // so that the current compiler version will be visible in the list
  createRenderEffect(() => {
    const untrackedCurrentCompilerVersion = untrack(currentCompilerVersion);
    const untrackedNumberOfProductionVersionsToDisplay = untrack(
      numberOfProductionVersionsToDisplay,
    );
    const untrackedNumberOfPreviewVersionsToDisplay = untrack(
      numberOfPreviewVersionsToDisplay,
    );
    const untrackedVersionsType = untrack(versionsType);

    if (
      typeof categorizedCompilerVersions() === "undefined" ||
      typeof untrackedCurrentCompilerVersion === "undefined"
    )
      return;
    const isPreviewModeSelected = untrackedVersionsType === "Preview";

    const isPreviewCompilerSelected = isPreviewVersion(
      untrackedCurrentCompilerVersion!,
    );

    setVersionsType(isPreviewCompilerSelected ? "Preview" : "Production");

    const versionToAcess = isPreviewCompilerSelected
      ? "previewVersions"
      : "productionVersions";
    const usedCompilerVersions = categorizedCompilerVersions()![versionToAcess];
    const indexOfCurrentCompilerVersion = usedCompilerVersions.indexOf(
      untrackedCurrentCompilerVersion!,
    );
    let _numberOfProductionVersionsToDisplay =
      untrackedNumberOfProductionVersionsToDisplay;
    let _numberOfPreviewVersionsToDisplay =
      untrackedNumberOfPreviewVersionsToDisplay;
    const numberOfVersionsOfUsedType = isPreviewModeSelected
      ? _numberOfPreviewVersionsToDisplay
      : _numberOfProductionVersionsToDisplay;

    if (
      indexOfCurrentCompilerVersion === -1 ||
      indexOfCurrentCompilerVersion <= numberOfVersionsOfUsedType
    )
      return;

    // increase the number of versions to display by STEP
    // up until the point we reach or exceed the index of
    // the current compiler version
    for (
      let i = numberOfVersionsOfUsedType;
      i < indexOfCurrentCompilerVersion;
      i += STEP
    ) {
      if (isPreviewModeSelected) {
        _numberOfPreviewVersionsToDisplay += STEP;
        continue;
      }
      _numberOfProductionVersionsToDisplay += STEP;
    }
    setNumberOfPreviewVersionsToDisplay(_numberOfPreviewVersionsToDisplay);
    setNumberOfProductionVersionsToDisplay(
      _numberOfProductionVersionsToDisplay,
    );
  });

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
    // TODO: later handle the case when the we switch to a mode which has the
    // same type as the current compiler version
    // in that case we should scroll to the current compiler version button,
    // instead of scrolling to the top
    scrollToTop();
  };

  let isHandlingCompilerVersionChange = false;
  const handleCompilerVersionChange = async (version: string) => {
    // don't handle the change if it's already being handled
    // this prevents the user from trying to change the compiler version
    // multiple times while a change is pending
    if (isHandlingCompilerVersionChange) return;
    const handler = createCompilerChangeHandler({
      onSuccessfulChange(version) {
        setCurrentCompilerVersion(version);
        // setHasCompilerVersionChangeBeenHandled(true);
      },
    });
    isHandlingCompilerVersionChange = true;
    await handler(version);
    props.closeModal();
    isHandlingCompilerVersionChange = false;
  };

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
    setIsLoadingCompilerVersions,
    isLoadingCompilerVersions,
  };
}

export function useVersionsList(props: VersionsListProps) {
  // TODO: move the observer logic to
  // shadow component
  let pixelToObserveTop: HTMLDivElement | null = null;
  let pixelToObserveBottom: HTMLDivElement | null = null;

  let shadowTopRef: HTMLDivElement | null = null;
  let shadowBottomRef: HTMLDivElement | null = null;

  type ShadowRelatedRefs = {
    shadowTopRef: HTMLDivElement | null;
    shadowBottomRef: HTMLDivElement | null;
    pixelToObserveTop: HTMLDivElement | null;
    pixelToObserveBottom: HTMLDivElement | null;
  };
  // We need to have the references of the refs,
  // otherwise, they can't be initialized
  const shadowRelatedRefs = {
    shadowTopRef,
    shadowBottomRef,
    pixelToObserveTop,
    pixelToObserveBottom,
  } as unknown as ShadowRelatedRefs;

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

  createEffect(
    on(allCompilerVersions, () => {
      queueMicrotask(() => {
        scrollToSelectedVersion();
      });
    }),
  );

  onMount(() => {
    const topObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          shadowRelatedRefs.shadowTopRef!.classList.add("shadow-show");
        } else {
          shadowRelatedRefs.shadowTopRef!.classList.remove("shadow-show");
        }
      },
      { root: listContainerRefPointer.current! },
    );
    topObserver.observe(shadowRelatedRefs.pixelToObserveTop!);

    const bottomObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          shadowRelatedRefs.shadowBottomRef!.classList.add("shadow-show");
        } else {
          shadowRelatedRefs.shadowBottomRef!.classList.remove("shadow-show");
        }
      },
      { root: listContainerRefPointer.current!, rootMargin: "10px" },
    );
    bottomObserver.observe(shadowRelatedRefs.pixelToObserveBottom!);
  });

  return {
    allCompilerVersions,
    versionsToDisplay,
    shadowRelatedRefs,
  };
}

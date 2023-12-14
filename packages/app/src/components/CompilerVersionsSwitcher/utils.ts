import { setCompilerWithFallbackHandling } from "~/lib/compiler/module";

export function createCompilerChangeHandler(
  afterCompilerChange: (version: string) => Promise<void> | void,
) {
  return (version: string) =>
    setCompilerWithFallbackHandling(version, () =>
      afterCompilerChange(version),
    );
}

let prevVersionListScrollDifference: number = 0;
export let listContainerRefPointer: { current: HTMLDivElement | null } = {
  current: null,
};

export function scrollToBottom() {
  if (listContainerRefPointer.current) {
    const scrollDifference =
      -listContainerRefPointer.current.clientHeight +
      listContainerRefPointer.current.scrollHeight;
    if (prevVersionListScrollDifference === scrollDifference) return;
    listContainerRefPointer.current.scrollTo({
      top: listContainerRefPointer.current.scrollHeight,
      behavior: "smooth",
    });
    prevVersionListScrollDifference = scrollDifference;
  }
}

export function scrollToTop() {
  if (
    listContainerRefPointer.current &&
    listContainerRefPointer.current.scrollTop !== 0
  ) {
    listContainerRefPointer.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

export function scrollToSelectedVersion() {
  const selectedCompilerVersionButtonEl =
    document.querySelector<HTMLButtonElement>(
      "[data-selected-compiler-button]",
    );
  if (selectedCompilerVersionButtonEl) {
    selectedCompilerVersionButtonEl.scrollIntoView(false);
  }
}

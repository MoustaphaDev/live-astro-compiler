import {
  For,
  createMemo,
  createResource,
  createSignal,
  onMount,
} from "solid-js";

import { VsChromeClose } from "solid-icons/vs";
import { Button, Dialog } from "@kobalte/core";
import {
  SegmentedButton,
  Separator,
  TextField,
  ToggleButton,
  ToggleField,
} from "./ui-kit";
import {
  parsePosition,
  setParsePosition,
  transformInternalURL,
  setTransformInternalURL,
  filename,
  setFilename,
  normalizedFilename,
  setNormalizedFilename,
  transformAstroGlobalArgs,
  setTransformAstroGlobalArgs,
  transformCompact,
  setTranformCompact,
  transformResultScopedSlot,
  setTransformResultScopedSlot,
  setCurrentCompilerVersion,
  setHasCompilerVersionChangeBeenHandled,
} from "~/lib/stores";
// import useSWR from "solid-swr";
import { fetchAllCompilerVersions } from "~/lib/compiler/fetch";
import { getCompilerVersionsByType } from "~/lib/compiler/utils";
import { setCompiler } from "~/lib/compiler";
import { getDefaultCompilerVersionToLoad } from "~/lib/compiler/module";

export type SettingsSectionProps = {
  closeModal: () => void;
};
export default function SettingsSection(props: SettingsSectionProps) {
  let dialogHeader: HTMLDivElement | null = null;
  let dialogDescriptionRef: HTMLDivElement | null = null;
  let parseOptionsRef: HTMLHeadingElement | null = null;
  onMount(() => {
    // take the `parseOptions` heading as a reference to observe the scrolled navbar
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) {
          dialogHeader!.classList.add("shadow-custom");
        } else {
          dialogHeader!.classList.remove("shadow-custom");
        }
      },
      { rootMargin: "-50px", root: dialogDescriptionRef! },
    );
    observer.observe(parseOptionsRef!);
  });

  return (
    <div class="fixed top-0 z-50 h-screen [&_*]:select-none [@supports_selector(:has(+_*))]:[&:has([data-closed])]:animate-[contentHide_300ms_cubic-bezier(0.4,_0,_0.2,_1)] [@supports_selector(:has(+_*))]:[&:has([data-expanded])]:animate-[contentShow_300ms_cubic-bezier(0.4,_0,_0.2,_1)]">
      <Dialog.Content class="z-50  h-full w-screen overflow-hidden rounded-md bg-primary font-montserrat sm:w-[700px] sm:max-w-[min(calc(100vw_-_16px),1000px)]">
        <div
          class="flex h-24 items-center justify-between overflow-y-auto bg-zinc-900 px-5 transition-shadow duration-200 sm:px-10"
          ref={dialogHeader!}
        >
          <Dialog.Title class="text-3xl font-bold text-white">
            Settings
          </Dialog.Title>
          <Dialog.CloseButton class="h-6 w-6 text-zinc-600 outline-none transition-colors hover:text-zinc-500 focus-visible:text-zinc-500 focus-visible:ring-2 focus-visible:ring-accent-2">
            <VsChromeClose class="h-6 w-6" />
          </Dialog.CloseButton>
        </div>
        <Dialog.Description
          class="relative h-[calc(100vh-theme(spacing.24))] w-full overflow-auto px-5 text-base text-zinc-700 sm:px-10 [&::-webkit-scrollbar-thumb]:rounded-full"
          ref={dialogDescriptionRef!}
        >
          <div class="mt-10 flex h-full flex-col space-y-10">
            {/* display the version changer */}
            <VersionSwitcher closeModal={props.closeModal} />
            <Separator />
            {/* display all the `Parse` options */}
            <div>
              <h3
                class="text-md mb-2 font-bold text-white"
                ref={parseOptionsRef!}
              >
                Parse Options
              </h3>
              <div>
                <ToggleField label="position">
                  <ToggleButton
                    pressed={parsePosition()}
                    onChange={setParsePosition}
                    title="Toggle position"
                    aria-label="Toggle positoin"
                  />
                </ToggleField>
              </div>
            </div>
            {/* display all the `Transform` options */}
            <Separator />
            <div>
              <h3 class="text-md mb-2 font-bold text-white">
                Transform Options
              </h3>
              <div>
                <TextField
                  placeholder="internalURL"
                  value={transformInternalURL()}
                  onChange={setTransformInternalURL}
                >
                  internalURL
                </TextField>
                <TextField
                  placeholder="filename"
                  value={filename()}
                  onChange={setFilename}
                >
                  filename
                </TextField>
                <TextField
                  placeholder="normalizedFilename"
                  value={normalizedFilename()}
                  onChange={setNormalizedFilename}
                >
                  normalizedFilename
                </TextField>
                <TextField
                  placeholder="astroGlobalArgs"
                  value={transformAstroGlobalArgs()}
                  onChange={setTransformAstroGlobalArgs}
                >
                  astroGlobalArgs
                </TextField>
                <ToggleField label="compact">
                  <ToggleButton
                    pressed={transformCompact()!}
                    onChange={setTranformCompact}
                    title="Toggle compact"
                    aria-label="Toggle compact"
                  />
                </ToggleField>
                <ToggleField label="resultScopedSlot">
                  <ToggleButton
                    pressed={transformResultScopedSlot()}
                    onChange={setTransformResultScopedSlot}
                    title="Toggle position"
                    aria-label="Toggle positoin"
                  />
                </ToggleField>
              </div>
            </div>
            {/* display all the `ConvertToTSX` options */}
            <Separator />
            <div>
              <h3 class="text-md mb-2 font-bold text-white">
                ConvertToTSX Options
              </h3>
              <div>
                <TextField
                  placeholder="filename"
                  value={filename()}
                  onChange={setFilename}
                >
                  convertToTSXFilename
                </TextField>
                <TextField
                  placeholder="normalizedFilename"
                  value={normalizedFilename()}
                  onChange={setNormalizedFilename}
                >
                  normalizedFilename
                </TextField>
              </div>
            </div>
            <div class="flex h-full w-full !select-text items-end justify-center text-center font-montserrat text-zinc-300">
              <div class="w-full">
                <Separator />
                <div class="my-14">
                  Made with <span class=" text-red-500">♥</span> by{" "}
                  <a
                    href="https://github.com/MoustaphaDev"
                    class="!select-text italic text-accent-2 hover:underline"
                  >
                    Moustapha Kebe
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Description>
      </Dialog.Content>
    </div>
  );
}

// TODO: let's get it to work now
// and later refactor for efficiency

function createCompilerChangeHandler(
  afterCompilerChange: () => Promise<void> | void,
) {
  return (version: string) => {
    setHasCompilerVersionChangeBeenHandled(false);
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
      setHasCompilerVersionChangeBeenHandled(true);
      await afterCompilerChange();
    });
  };
}

type VersionSwitcherProps = SettingsSectionProps;
function VersionSwitcher(props: VersionSwitcherProps) {
  const [versionsType, setVersionsType] = createSignal("Preview");
  const [
    numberOfProductionVersionsToDisplay,
    setNumberOfProductionVersionsToDisplay,
  ] = createSignal(10);
  const [
    numberOfPreviewVersionsToDisplay,
    setNumberOfPreviewVersionsToDisplay,
  ] = createSignal(10);

  const [allCompilerVersions] = createResource(fetchAllCompilerVersions);

  const categorizedCompilerVersions = createMemo(() => {
    return getCompilerVersionsByType(allCompilerVersions() ?? []);
  });

  const versionsToDisplay = createMemo(() =>
    versionsType() === "Preview"
      ? categorizedCompilerVersions().previewVersions.slice(
          0,
          numberOfPreviewVersionsToDisplay(),
        )
      : categorizedCompilerVersions().productionVersions.slice(
          0,
          numberOfProductionVersionsToDisplay(),
        ),
  );

  const handleShowMore = () => {
    if (versionsType() === "Preview") {
      setNumberOfPreviewVersionsToDisplay(
        numberOfPreviewVersionsToDisplay() + 5,
      );
    } else {
      setNumberOfProductionVersionsToDisplay(
        numberOfProductionVersionsToDisplay() + 5,
      );
    }
  };

  const handleCompilerVersionChange = createCompilerChangeHandler(
    props.closeModal,
  );

  return (
    <div>
      <div class="flex flex-row items-center justify-between">
        <h3 class="text-md font-semibold leading-none text-white">Versions</h3>
        <SegmentedButton
          activeClass="bg-accent-2 !text-primary !font-semibold"
          options={["Preview", "Production"]}
          defaultActive="Preview"
          handleOptionChange={setVersionsType}
        />
      </div>
      <div class="mb-10 mt-10 flex h-56 flex-wrap gap-x-8 gap-y-8 overflow-y-auto">
        <For each={versionsToDisplay()}>
          {(version) => {
            return (
              <Button.Root
                onClick={() => handleCompilerVersionChange(version)}
                class="bg-[#222] px-3 py-2 text-zinc-100"
              >
                {version}
              </Button.Root>
            );
          }}
        </For>
      </div>
      <div class="flex items-center justify-center">
        <Button.Root
          onClick={handleShowMore}
          class="bg-zinc-700 px-3 py-2 text-zinc-50"
        >
          Show more
        </Button.Root>
      </div>
    </div>
  );
}

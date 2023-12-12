import { getPersistedValue, setPersistentValue } from "../stores/utils";
import type { CompatibilityMap } from "./in-browser-tests";
import { getNextDays } from "./utils";

export type StoredCompilerDetails = {
  version: string;
  compatibilityMap: CompatibilityMap;
};
type LatestCompilerDetailsStored = StoredCompilerDetails & {
  expires: string;
};

const COMPILER_KEY_PREFIX = "compiler-version";
const LAST_USED_COMPILER_VERSION_KEY = "last-used-compiler-version";

function createCompilerVersionKey(version: string) {
  return `${COMPILER_KEY_PREFIX}-${version}`;
}

export function getLastUsedCompilerVersion() {
  const lastUsedVersion = getPersistedValue<string>(
    LAST_USED_COMPILER_VERSION_KEY,
  );
  return lastUsedVersion;
}

export function storeLastUsedCompilerVersion(version: string | undefined) {
  if (!version) {
    return;
  }
  setPersistentValue(LAST_USED_COMPILER_VERSION_KEY, version);
}

export function getStoredCompilerDetails(version: string) {
  const compilerLocalStorageKey = createCompilerVersionKey(version);
  const storedCompilerDetails = getPersistedValue<LatestCompilerDetailsStored>(
    compilerLocalStorageKey,
  );
  if (storedCompilerDetails) {
    if (new Date(storedCompilerDetails.expires) > new Date()) {
      return storedCompilerDetails;
    }
    localStorage.removeItem(compilerLocalStorageKey);
  }
  return null;
}

export function storeCompilerDetails(details: StoredCompilerDetails) {
  const key = createCompilerVersionKey(details.version);
  const detailsToStore = Object.assign(
    { expires: getNextDays().toISOString() },
    details,
  ) satisfies LatestCompilerDetailsStored;
  setPersistentValue(key, detailsToStore);
}

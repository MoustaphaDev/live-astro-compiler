
import { getPersistedValue, setPersistentValue } from "../stores/utils";
import { getNextDays } from "./utils";

export type CompatibilityStatus = "compatible" | "incompatible" | "partially-compatible"
export type StoredCompilerDetails = {
    version: string;
    compatibility: CompatibilityStatus;
}
type LatestCompilerDetailsStored = StoredCompilerDetails & {
    expires: string
}

const COMPILER_KEY_PREFIX = "compiler-version"

function createCompilerVersionKey(version: string)
{
    return `${COMPILER_KEY_PREFIX}-${version}`
}

export function getLastUsedCompilerVersion()
{
    const lastUsedVersion = getPersistedValue<string>("last-used-compiler-version")
    return lastUsedVersion
}

export function setLastUsedCompilerVersion(version: string)
{
    setPersistentValue("last-used-compiler-version", version)
}


export function getStoredCompilerDetails(version: string)
{
    const compilerLocalStorageKey = createCompilerVersionKey(version)
    const storedCompilerDetails = getPersistedValue<LatestCompilerDetailsStored>(compilerLocalStorageKey)
    if (storedCompilerDetails) {
        if (new Date(storedCompilerDetails.expires) > new Date()) {
            return storedCompilerDetails
        }
        localStorage.removeItem(compilerLocalStorageKey)
    }
    return null
}

export function storeCompilerDetails(details: StoredCompilerDetails)
{
    const key = createCompilerVersionKey(details.version)
    const detailsToStore = Object.assign({ expires: getNextDays().toISOString() }, details) satisfies LatestCompilerDetailsStored;
    setPersistentValue(key, detailsToStore)
}


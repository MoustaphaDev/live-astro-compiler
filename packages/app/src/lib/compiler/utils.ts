import type { StoredCompilerDetails } from "./storage"

export const getNextDays = (currentDate = new Date(), daysToAdd = 1) =>
{
    const nextDate = new Date(currentDate)
    nextDate.setDate(currentDate.getDate() + daysToAdd)
    return nextDate
}

export function getCompatibilityStatus(storedCompilerDetails: StoredCompilerDetails): StoredCompilerDetails["compatibilityMap"] | "unmarked"
{
    if (storedCompilerDetails) {
        return storedCompilerDetails.compatibilityMap
    }
    return "unmarked"
}


export function getCompilerVersionsByType(allCompilerVersions: string[])
{
    const PREVIEW_VERSION_PREFIX = "0.0.0-";
    const previewVersions = [];
    const productionVersions = []
    for (const version of allCompilerVersions) {
        if (version.startsWith(PREVIEW_VERSION_PREFIX)) {
            previewVersions.push(version)
        } else {
            productionVersions.push(version)
        }
    }
    return { previewVersions, productionVersions }
}



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

type GetCompilerVerionsByTypeOptions = {
    allCompilerVersions: string[]
    type: "preview" | "production"
}
export function getCompilerVersionsByType({ allCompilerVersions, type }: GetCompilerVerionsByTypeOptions)
{
    const PREVIEW_VERSION_PREFIX = "0.0.0-";
    if (type === "preview") {
        return allCompilerVersions.filter((version) => version.startsWith(PREVIEW_VERSION_PREFIX))
    }
    if (type === "production") {
        return allCompilerVersions.filter((version) => !version.startsWith(PREVIEW_VERSION_PREFIX))
    }
    throw new Error(`Invalid compiler type: ${type}`)
}



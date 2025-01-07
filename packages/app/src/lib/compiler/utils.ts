import type { StoredCompilerDetails } from "./storage";

export const getNextDays = (currentDate = new Date(), daysToAdd = 1) => {
  const nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + daysToAdd);
  return nextDate;
};

// unused, but keeping it as we might need it later
export function getCompatibilityStatus(
  storedCompilerDetails: StoredCompilerDetails,
): StoredCompilerDetails["compatibilityMap"] | "unmarked" {
  if (storedCompilerDetails) {
    return storedCompilerDetails.compatibilityMap;
  }
  return "unmarked";
}

export function getCompilerVersionsByType(allCompilerVersions: string[]) {
  const previewVersions = [];
  const productionVersions = [];
  for (const version of allCompilerVersions) {
    if (isPreviewVersion(version)) {
      previewVersions.push(version);
    } else {
      productionVersions.push(version);
    }
  }
  return { previewVersions, productionVersions };
}

export function isPreviewVersion(version: string): boolean {
  const PREVIEW_VERSION_PREFIX = "0.0.0-";
  return version.startsWith(PREVIEW_VERSION_PREFIX);
}

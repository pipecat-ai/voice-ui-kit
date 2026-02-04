/**
 * Version comparison utilities for semantic versioning using the semver package
 */

import semver from "semver";

/**
 * Converts a version array [major, minor, patch] to a semver string
 */
function versionArrayToString(version: [number, number, number]): string {
  return `${version[0]}.${version[1]}.${version[2]}`;
}

/**
 * Checks if a version meets a minimum version requirement.
 * @param currentVersion - The current version string (e.g., "0.0.98")
 * @param minVersion - The minimum version as an array [major, minor, patch]
 * @returns true if currentVersion >= minVersion
 */
export function isMinVersion(
  currentVersion: string,
  minVersion: [number, number, number],
): boolean {
  const minVersionStr = versionArrayToString(minVersion);
  return semver.gte(currentVersion, minVersionStr);
}

/**
 * Checks if a version is below a maximum version.
 * @param currentVersion - The current version string (e.g., "0.0.98")
 * @param maxVersion - The maximum version as an array [major, minor, patch]
 * @returns true if currentVersion <= maxVersion
 */
export function isMaxVersion(
  currentVersion: string,
  maxVersion: [number, number, number],
): boolean {
  const maxVersionStr = versionArrayToString(maxVersion);
  return semver.lte(currentVersion, maxVersionStr);
}

/**
 * Checks if a version is within a version range (inclusive).
 * @param currentVersion - The current version string (e.g., "0.0.98")
 * @param minVersion - The minimum version as an array [major, minor, patch]
 * @param maxVersion - The maximum version as an array [major, minor, patch]
 * @returns true if minVersion <= currentVersion <= maxVersion
 */
export function isVersionInRange(
  currentVersion: string,
  minVersion: [number, number, number],
  maxVersion: [number, number, number],
): boolean {
  const minVersionStr = versionArrayToString(minVersion);
  const maxVersionStr = versionArrayToString(maxVersion);
  // Use semver's satisfies with a range
  return semver.satisfies(
    currentVersion,
    `>=${minVersionStr} <=${maxVersionStr}`,
  );
}

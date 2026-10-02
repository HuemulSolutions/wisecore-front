export type VersionBannerVariant =
  | 'externalLocked'
  | 'externalFailed'
  | 'otherVersion'
  | 'generating'
  | 'partialRun';

export type VersionBannerTone = 'amber' | 'red' | 'blue' | 'indigo' | 'green' | 'gray';

export const VERSION_BANNER_VARIANTS: readonly VersionBannerVariant[] = [
  'externalLocked',
  'externalFailed',
  'otherVersion',
  'generating',
  'partialRun',
];

export function isVersionBannerVariant(value: unknown): value is VersionBannerVariant {
  return typeof value === 'string' && (VERSION_BANNER_VARIANTS as readonly string[]).includes(value);
}

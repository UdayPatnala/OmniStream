/**
 * OmniStream Authoritative Application Version
 * Strictly governed by Universal Version Controller + Change Governance System (A.BC.DE.F)
 *
 * Single Source of Truth for Live Application Runtime and UI Metadata.
 */
export const APP_VERSION = '1.09.13.0';
export const APP_VERSION_LABEL = `v${APP_VERSION}`;
export const APP_RELEASE_STATUS = 'VERIFIED' as const;

export interface AppVersionMetadata {
  readonly version: string;
  readonly label: string;
  readonly status: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'BLOCKED' | 'IN_DEVELOPMENT';
  readonly releaseDate: string;
  readonly governanceFormat: 'A.BC.DE.F';
}

export const APP_VERSION_METADATA: AppVersionMetadata = {
  version: APP_VERSION,
  label: APP_VERSION_LABEL,
  status: APP_RELEASE_STATUS,
  releaseDate: '2026-10-10',
  governanceFormat: 'A.BC.DE.F',
};

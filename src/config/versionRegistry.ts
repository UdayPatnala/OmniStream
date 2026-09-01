/**
 * OmniStream Hierarchical Version Registry
 * Authoritative Single Source of Truth for Release and Subsystem Version Metadata
 *
 * Hierarchy:
 * LEVEL 1: OmniStream Authoritative Release Version (OS)
 * LEVEL 2: Flagship Product Modules (CineMorph CM, U-Tube UT)
 * LEVEL 3: Core Independent Subsystems Only (Smart Framing SF, Video Quality VQ, Audio DSP DSP)
 */

export interface SubsystemVersionInfo {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
}

export interface ProductVersionInfo {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly version: string;
  readonly subsystems?: readonly SubsystemVersionInfo[];
}

export interface OmniStreamVersionRegistry {
  readonly version: string; // Authoritative OS Version (matches package.json and git tags)
  readonly codename: string;
  readonly releaseDate: string;
  readonly status: 'STABLE_BASELINE' | 'ACTIVE_DEVELOPMENT' | 'RELEASE_CANDIDATE';
  readonly products: {
    readonly cinemorph: ProductVersionInfo;
    readonly utube: ProductVersionInfo;
  };
}

export const VERSION_REGISTRY: OmniStreamVersionRegistry = {
  version: '1.5.1',
  codename: 'Threshold Baseline (Theater Hardened)',
  releaseDate: '2026-09-01',
  status: 'STABLE_BASELINE',
  products: {
    cinemorph: {
      id: 'cinemorph',
      code: 'CM',
      name: 'CineMorph Theater & Private Ingest',
      version: '1.5.1',
      subsystems: [
        {
          id: 'smart-framing',
          code: 'CM-SF',
          name: 'Adaptive Smart Framing Engine',
          version: '1.0.1',
          description: 'Aspect-ratio proscenium aperture geometry, deadband hysteresis, and temporal smoothing',
        },
        {
          id: 'video-quality',
          code: 'CM-VQ',
          name: 'Video & Frame Quality Intelligence',
          version: '1.0.0',
          description: 'Laplacian edge variance sharpness, contrast entropy, and multi-tier poster cascade ranking',
        },
        {
          id: 'audio-dsp',
          code: 'CM-DSP',
          name: '5-Band Parametric Audio DSP',
          version: '1.0.0',
          description: 'Web Audio API biquad filter graph, dialogue clarity, and spatial acoustic simulation',
        },
      ],
    },
    utube: {
      id: 'utube',
      code: 'UT',
      name: 'U-Tube Video Discovery & Watch Engine',
      version: '1.5.1',
      subsystems: [], // U-Tube operates as a single unified product module
    },
  },
} as const;

/**
 * Returns formatted version string for developer telemetry and diagnostics
 */
export function getSystemVersionSummary(): string {
  const { version, products } = VERSION_REGISTRY;
  const cm = products.cinemorph;
  const ut = products.utube;
  return `OmniStream v${version} [${cm.code}:v${cm.version}, ${ut.code}:v${ut.version}]`;
}

/**
 * Returns full architectural version diagnostic payload
 */
export function getVersionDiagnostics(): Record<string, string> {
  const { version, codename, products } = VERSION_REGISTRY;
  const diag: Record<string, string> = {
    'OmniStream Release': `v${version} (${codename})`,
    'CineMorph Product': `v${products.cinemorph.version}`,
    'U-Tube Product': `v${products.utube.version}`,
  };

  if (products.cinemorph.subsystems) {
    for (const sub of products.cinemorph.subsystems) {
      diag[`Subsystem (${sub.code})`] = `${sub.name} v${sub.version}`;
    }
  }

  return diag;
}

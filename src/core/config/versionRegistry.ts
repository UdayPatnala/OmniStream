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
  readonly status: 'STABLE_BASELINE' | 'ACTIVE_DEVELOPMENT' | 'RELEASE_CANDIDATE' | 'STABLE_RELEASE';
  readonly products: {
    readonly cinemorph: ProductVersionInfo;
    readonly utube: ProductVersionInfo;
  };
}

export const VERSION_REGISTRY: OmniStreamVersionRegistry = {
  version: '1.8.0',
  codename: 'Universal Perception & Intelligent Smart Framing',
  releaseDate: '2026-09-02',
  status: 'STABLE_RELEASE',
  products: {
    cinemorph: {
      id: 'cinemorph',
      code: 'CM',
      name: 'CineMorph Theater & Private Ingest',
      version: '1.8.0',
      subsystems: [
        {
          id: 'smart-framing',
          code: 'CM-SF',
          name: 'Adaptive Smart Framing Engine',
          version: '1.8.0',
          description: 'Enhanced composition scoring, switching hysteresis, and spring temporal controller',
        },
        {
          id: 'perception',
          code: 'CM-PERCEPT',
          name: 'Universal Visual & Audio Perception System',
          version: '1.8.0',
          description: 'Client-side BlazeFace WASM SIMD and Web Audio API spectral perception',
        },
        {
          id: 'stream-demux',
          code: 'CM-DEMUX',
          name: 'Lightweight Client-Side Stream Demuxer',
          version: '1.0.0',
          description: 'ISOBMFF MP4/MOV and EBML Matroska/WebM binary header scanner',
        },
        {
          id: 'audio-router',
          code: 'CM-AUD',
          name: 'Active Audio Routing & Hardware Stream Selector',
          version: '1.0.1',
          description: 'HTMLMediaElement multi-track audio switching and Web Audio synchronization',
        },
        {
          id: 'video-quality',
          code: 'CM-VQ',
          name: 'Video & Frame Quality Intelligence',
          version: '1.8.0',
          description: 'Laplacian variance sharpness, contrast entropy, and cascaded poster intelligence',
        },
        {
          id: 'audio-dsp',
          code: 'CM-DSP',
          name: '5-Band Parametric Audio DSP & Dynamic Clarity',
          version: '1.8.0',
          description: 'Web Audio API biquad filter graph, dynamic clarity boost, and spatial acoustic simulation',
        },
      ],
    },
    utube: {
      id: 'utube',
      code: 'UT',
      name: 'U-Tube Video Discovery & Watch Engine',
      version: '1.8.0',
      subsystems: [], // U-Tube operates as a single unified product module
    },
  },
};

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

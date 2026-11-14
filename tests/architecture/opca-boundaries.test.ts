/**
 * OPCA Architectural Boundaries & Invariants Enforcement Test Suite
 *
 * Verifies the fundamental architectural rules of OmniStream:
 * 1. U-Tube must NEVER import from CineMorph.
 * 2. CineMorph must NEVER import from U-Tube.
 * 3. OmniStream Core must NEVER import from U-Tube or CineMorph.
 * 4. OmniStream Shared must NEVER import from Products, Core, or Shell.
 * 5. Product public barrel APIs export valid contracts.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function getSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractImportPaths(fileContent: string): string[] {
  // Matches static import/export declarations: import ... from '...', export ... from '...', import '...'
  const staticRegex = /(?:import|export)(?:\s+type)?\s+(?:(?:[\w*\s{},]+|\*\s+as\s+[\w]+)\s+from\s+)?['"]([^'"]+)['"]/g;
  // Matches dynamic imports: import('...') and import ("...")
  const dynamicRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const paths: string[] = [];
  let match;
  while ((match = staticRegex.exec(fileContent)) !== null) {
    paths.push(match[1]);
  }
  while ((match = dynamicRegex.exec(fileContent)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

const SRC_ROOT = path.resolve(__dirname, '../../src');
const UTUBE_DIR = path.join(SRC_ROOT, 'products/u-tube');
const CINEMORPH_DIR = path.join(SRC_ROOT, 'products/cinemorph');
const CORE_DIR = path.join(SRC_ROOT, 'core');
const SHARED_DIR = path.join(SRC_ROOT, 'shared');
const SHELL_DIR = path.join(SRC_ROOT, 'shell');

describe('OPCA Architectural Boundaries & Module Isolation', () => {

  it('Rule 1: U-Tube capsule must never import CineMorph internal code', () => {
    const files = getSourceFiles(UTUBE_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const importPaths = extractImportPaths(content);

      for (const p of importPaths) {
        if (
          p.includes('cinemorph') ||
          p.startsWith('@omnistream/cinemorph')
        ) {
          violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
        } else if (p.startsWith('.')) {
          const resolved = path.resolve(path.dirname(file), p);
          if (resolved.startsWith(CINEMORPH_DIR)) {
            violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
          }
        }
      }
    }

    expect(violations, `U-Tube -> CineMorph boundary violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 2: CineMorph capsule must never import U-Tube internal code', () => {
    const files = getSourceFiles(CINEMORPH_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const importPaths = extractImportPaths(content);

      for (const p of importPaths) {
        if (
          p.includes('u-tube') ||
          p.includes('/youtube') ||
          p.startsWith('@omnistream/utube')
        ) {
          violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
        } else if (p.startsWith('.')) {
          const resolved = path.resolve(path.dirname(file), p);
          if (resolved.startsWith(UTUBE_DIR)) {
            violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
          }
        }
      }
    }

    expect(violations, `CineMorph -> U-Tube boundary violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 3: OmniStream Core must never import from Products, Shell, or store directly', () => {
    const files = getSourceFiles(CORE_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const importPaths = extractImportPaths(content);

      for (const p of importPaths) {
        if (
          p.includes('store') ||
          p.includes('products') ||
          p.includes('u-tube') ||
          p.includes('cinemorph') ||
          p.includes('shell') ||
          p.includes('app') ||
          p.startsWith('@omnistream/utube') ||
          p.startsWith('@omnistream/cinemorph') ||
          p.startsWith('@omnistream/shell')
        ) {
          violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
        } else if (p.startsWith('.')) {
          const resolved = path.resolve(path.dirname(file), p);
          if (
            resolved.startsWith(UTUBE_DIR) ||
            resolved.startsWith(CINEMORPH_DIR) ||
            resolved.startsWith(SHELL_DIR) ||
            resolved === path.join(SRC_ROOT, 'store.ts') ||
            resolved === path.join(SRC_ROOT, 'store')
          ) {
            violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
          }
        }
      }
    }

    expect(violations, `Core -> Product/Shell/Store boundary violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 4: OmniStream Shared must be pure primitives with zero Product or Core imports', () => {
    const files = getSourceFiles(SHARED_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const importPaths = extractImportPaths(content);

      for (const p of importPaths) {
        if (
          p.includes('products') ||
          p.includes('u-tube') ||
          p.includes('cinemorph') ||
          p.includes('core') ||
          p.includes('shell') ||
          p.startsWith('@omnistream/utube') ||
          p.startsWith('@omnistream/cinemorph') ||
          p.startsWith('@omnistream/core') ||
          p.startsWith('@omnistream/shell')
        ) {
          violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
        } else if (p.startsWith('.')) {
          const resolved = path.resolve(path.dirname(file), p);
          if (
            resolved.startsWith(UTUBE_DIR) ||
            resolved.startsWith(CINEMORPH_DIR) ||
            resolved.startsWith(CORE_DIR) ||
            resolved.startsWith(SHELL_DIR)
          ) {
            violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
          }
        }
      }
    }

    expect(violations, `Shared -> Product/Core boundary violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 5: Product public barrel exports conform to encapsulation contracts', async () => {
    const utubeIndex = path.join(UTUBE_DIR, 'index.ts');
    const cinemorphIndex = path.join(CINEMORPH_DIR, 'index.ts');
    const coreIndex = path.join(CORE_DIR, 'index.ts');
    const sharedIndex = path.join(SHARED_DIR, 'index.ts');

    expect(fs.existsSync(utubeIndex)).toBe(true);
    expect(fs.existsSync(cinemorphIndex)).toBe(true);
    expect(fs.existsSync(coreIndex)).toBe(true);
    expect(fs.existsSync(sharedIndex)).toBe(true);

    const utubeContent = fs.readFileSync(utubeIndex, 'utf-8');
    expect(utubeContent).toContain('Home');
    expect(utubeContent).toContain('useUTubeStore');
    expect(utubeContent).toContain('VideoCardSkeleton');
    expect(utubeContent).toContain('fetchSearchSuggestions');
    expect(utubeContent).toContain('playbackService');
    expect(utubeContent).toContain('extractYouTubeId');

    const cinemorphContent = fs.readFileSync(cinemorphIndex, 'utf-8');
    expect(cinemorphContent).toContain('CineMorphLanding');
    expect(cinemorphContent).toContain('CineMorphTheater');
    expect(cinemorphContent).toContain('useCineMorphStore');
    expect(cinemorphContent).toContain('TicketPrinterAnimation');
    expect(cinemorphContent).toContain('requestLandscapeOrientation');

    const coreContent = fs.readFileSync(coreIndex, 'utf-8');
    expect(coreContent).toContain('storageService');
    expect(coreContent).toContain('omsTransitionService');
    expect(coreContent).toContain('errorRecoveryManager');
    expect(coreContent).toContain('resolveExternalMediaMeta');
    expect(coreContent).toContain('IntentRouter');

    const sharedContent = fs.readFileSync(sharedIndex, 'utf-8');
    expect(sharedContent).toContain('ErrorBoundary');
    expect(sharedContent).toContain('Skeleton');
    expect(sharedContent).toContain('cn');
    expect(sharedContent).toContain('formatDuration');
  });

  it('Rule 6: Authoritative root OMNISTREAM.md Product Master exists and documents ownership and change isolation', () => {
    const docPath = path.resolve(SRC_ROOT, '../OMNISTREAM.md');
    const vcPath = path.resolve(SRC_ROOT, '../VERSION_CONTROLLER.md');

    expect(fs.existsSync(docPath), 'OMNISTREAM.md Product Master must exist').toBe(true);
    expect(fs.existsSync(vcPath), 'VERSION_CONTROLLER.md Version Master must exist').toBe(true);

    const docContent = fs.readFileSync(docPath, 'utf-8');
    expect(docContent).toContain('System Overview');
    expect(docContent).toContain('Architectural Hierarchy');
    expect(docContent).toContain('Module Registry');
    expect(docContent).toContain('Change-Radius');
    expect(docContent).toContain('Master 18-Step Execution Loop');
    expect(docContent).toContain('DIRECT');
    expect(docContent).toContain('UNRELATED');
  });

  it('Rule 7: Zero Phantom Files — all canonical entries registered in OMNISTREAM.md exist on disk', () => {
    const registeredPaths = [
      'src/shell/index.ts',
      'src/core/shortcuts/shortcutManager.ts',
      'src/products/u-tube/index.ts',
      'src/products/u-tube/components/UTubePlayer.tsx',
      'src/products/cinemorph/pages/CineMorphTheater.tsx',
      'src/products/cinemorph/ticketing/TicketPrinterAnimation.tsx',
      'src/products/cinemorph/media/audioEngine.ts',
      'src/core/oms/omsTransitionService.ts',
      'src/core/storage/storageService.ts',
      'src/shared/index.ts',
    ];

    for (const relPath of registeredPaths) {
      const fullPath = path.resolve(SRC_ROOT, '..', relPath);
      expect(fs.existsSync(fullPath), `Registered file in OMNISTREAM.md does not exist on disk: ${relPath}`).toBe(true);
    }
  });

  it('Rule 8: Shell must never deep-import product, core, or shared internals', () => {
    const files = getSourceFiles(SHELL_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const importPaths = extractImportPaths(content);

      for (const p of importPaths) {
        // No deep alias imports into products, core, or shared
        if (
          p.startsWith('@omnistream/utube/') ||
          p.startsWith('@omnistream/cinemorph/') ||
          p.startsWith('@omnistream/shared/') ||
          p.startsWith('@omnistream/core/')
        ) {
          violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
        }

        // No relative cross-boundary imports into products, core, or shared internals
        if (p.startsWith('.')) {
          const targetAbs = path.resolve(path.dirname(file), p);
          const relToSrc = path.relative(SRC_ROOT, targetAbs).replace(/\\/g, '/');
          if (
            relToSrc.startsWith('products/') ||
            relToSrc.startsWith('core/') ||
            relToSrc.startsWith('shared/')
          ) {
            violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
          }
        }
      }
    }

    expect(violations, `Shell deep-import violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 9: CineMorph must never deep-import Core or Shared internals', () => {
    const files = getSourceFiles(CINEMORPH_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const importPaths = extractImportPaths(content);

      for (const p of importPaths) {
        if (
          p.startsWith('@omnistream/core/') ||
          p.startsWith('@omnistream/shared/') ||
          p.includes('/core/') ||
          p.includes('/shared/')
        ) {
          violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
        }
      }
    }

    expect(violations, `CineMorph deep-import violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 10: U-Tube must never deep-import Core or Shared internals', () => {
    const files = getSourceFiles(UTUBE_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: { file: string; importPath: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const importPaths = extractImportPaths(content);

      for (const p of importPaths) {
        if (
          p.startsWith('@omnistream/core/') ||
          p.startsWith('@omnistream/shared/') ||
          p.includes('/core/') ||
          p.includes('/shared/')
        ) {
          violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
        }
      }
    }

    expect(violations, `U-Tube deep-import violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 11: Store must only import Core via canonical public barrel and never import Shell', () => {
    const storePath = path.join(SRC_ROOT, 'store.ts');
    expect(fs.existsSync(storePath)).toBe(true);

    const content = fs.readFileSync(storePath, 'utf-8');
    const importPaths = extractImportPaths(content);
    const violations: string[] = [];

    for (const p of importPaths) {
      if (
        p.startsWith('@omnistream/core/') ||
        p.includes('./core/') ||
        p.includes('shell') ||
        p.startsWith('@omnistream/shell')
      ) {
        violations.push(p);
      }
    }

    expect(violations, `Store boundary violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 12: Shared module must not contain product-specific code or styles', () => {
    const files = getSourceFiles(SHARED_DIR);
    expect(files.length).toBeGreaterThan(0);

    const violations: { file: string; match: string }[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/(?:bg|border|text)-utube-/.test(content)) {
        violations.push({ file: path.relative(SRC_ROOT, file), match: 'utube- CSS class reference' });
      }
      if (content.includes('function extractYouTubeId')) {
        violations.push({ file: path.relative(SRC_ROOT, file), match: 'extractYouTubeId function' });
      }
      if (content.includes('VideoCardSkeleton')) {
        violations.push({ file: path.relative(SRC_ROOT, file), match: 'VideoCardSkeleton component' });
      }
    }

    expect(violations, `Shared purity violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 13: Import extractor accurately captures static, dynamic, re-export, and type-only imports', () => {
    const fixture = `
      import { A } from '@omnistream/core';
      import type { B } from '@omnistream/shared';
      export { C } from './local';
      export * from '../other';
      const m = await import('@omnistream/utube');
      const lazyComp = lazy(() => import('@omnistream/cinemorph'));
    `;
    const paths = extractImportPaths(fixture);
    expect(paths).toContain('@omnistream/core');
    expect(paths).toContain('@omnistream/shared');
    expect(paths).toContain('./local');
    expect(paths).toContain('../other');
    expect(paths).toContain('@omnistream/utube');
    expect(paths).toContain('@omnistream/cinemorph');
  });
});

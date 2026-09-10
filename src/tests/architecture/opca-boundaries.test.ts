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
  const importRegex = /(?:import|export)\s+(?:[\w*\s{},]+from\s+)?['"]([^'"]+)['"]/g;
  const paths: string[] = [];
  let match;
  while ((match = importRegex.exec(fileContent)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

const SRC_ROOT = path.resolve(__dirname, '../../');
const UTUBE_DIR = path.join(SRC_ROOT, 'products/u-tube');
const CINEMORPH_DIR = path.join(SRC_ROOT, 'products/cinemorph');
const CORE_DIR = path.join(SRC_ROOT, 'core');
const SHARED_DIR = path.join(SRC_ROOT, 'shared');

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
        }
      }
    }

    expect(violations, `CineMorph -> U-Tube boundary violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
  });

  it('Rule 3: OmniStream Core must never import from Products or Shell', () => {
    const files = getSourceFiles(CORE_DIR);
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
          p.includes('shell') ||
          p.includes('app') ||
          p.startsWith('@omnistream/utube') ||
          p.startsWith('@omnistream/cinemorph') ||
          p.startsWith('@omnistream/shell')
        ) {
          violations.push({ file: path.relative(SRC_ROOT, file), importPath: p });
        }
      }
    }

    expect(violations, `Core -> Product/Shell boundary violations: ${JSON.stringify(violations, null, 2)}`).toHaveLength(0);
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

    const cinemorphContent = fs.readFileSync(cinemorphIndex, 'utf-8');
    expect(cinemorphContent).toContain('CineMorphLanding');
    expect(cinemorphContent).toContain('CineMorphTheater');
    expect(cinemorphContent).toContain('useCineMorphStore');
    expect(cinemorphContent).toContain('TicketPrinterAnimation');
  });
});

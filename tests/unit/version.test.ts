import { describe, it, expect } from 'vitest';
import { APP_VERSION, APP_VERSION_LABEL, APP_RELEASE_STATUS, APP_VERSION_METADATA } from '@omnistream/core/config/version';
import packageJson from '@/package.json';
import fs from 'node:fs';
import path from 'node:path';

describe('Authoritative Application Version & Governance Consistency', () => {
  it('maintains valid A.BC.DE.F formatted authoritative version', () => {
    expect(APP_VERSION).toBe('1.09.13.0');
    expect(APP_VERSION_LABEL).toBe('v1.09.13.0');
    expect(APP_RELEASE_STATUS).toBe('VERIFIED');
    expect(APP_VERSION_METADATA.governanceFormat).toBe('A.BC.DE.F');
  });

  it('matches package.json version with authoritative APP_VERSION', () => {
    expect(packageJson.version).toBe(APP_VERSION);
  });

  it('matches VERSION_CONTROLLER.md current version with authoritative APP_VERSION', () => {
    const vcPath = path.resolve(__dirname, '../../VERSION_CONTROLLER.md');
    expect(fs.existsSync(vcPath)).toBe(true);

    const vcContent = fs.readFileSync(vcPath, 'utf8');
    expect(vcContent).toContain(`## Current Version\n\n\`${APP_VERSION}\``);
    expect(vcContent).toContain(`## Current Status\n\nVERIFIED`);
  });

  it('validates A.BC.DE.F format regex rules', () => {
    const versionRegex = /^[0-9]+\.[0-9]{2}\.[0-9]{2}\.[0-9]$/;
    expect(versionRegex.test(APP_VERSION)).toBe(true);

    const parts = APP_VERSION.split('.');
    expect(parts.length).toBe(4);
    expect(Number(parts[0])).toBeGreaterThanOrEqual(0); // Major A
    expect(Number(parts[1])).toBeGreaterThanOrEqual(1); // Sub-version BC (01-99)
    expect(Number(parts[2])).toBeGreaterThanOrEqual(1); // Functional DE (01-99)
    expect(Number(parts[3])).toBeGreaterThanOrEqual(0); // Patch F (0-9)
    expect(Number(parts[3])).toBeLessThanOrEqual(9);
  });
});

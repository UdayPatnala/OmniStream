import { describe, it, expect } from 'vitest';
import { VERSION_REGISTRY, getSystemVersionSummary, getVersionDiagnostics } from '../config/versionRegistry';

describe('OmniStream Hierarchical Version Registry', () => {
  it('maintains authoritative Level 1 release version matching v1.5.2', () => {
    expect(VERSION_REGISTRY.version).toBe('1.5.2');
    expect(VERSION_REGISTRY.status).toBe('STABLE_BASELINE');
  });

  it('contains valid Level 2 product modules for CineMorph and U-Tube', () => {
    expect(VERSION_REGISTRY.products.cinemorph.code).toBe('CM');
    expect(VERSION_REGISTRY.products.cinemorph.version).toBe('1.5.2');
    expect(VERSION_REGISTRY.products.utube.code).toBe('UT');
    expect(VERSION_REGISTRY.products.utube.version).toBe('1.5.2');
  });

  it('contains core independent CineMorph subsystems', () => {
    const subsystems = VERSION_REGISTRY.products.cinemorph.subsystems;
    expect(subsystems).toBeDefined();
    expect(subsystems?.length).toBe(5);

    const codes = subsystems?.map((s) => s.code);
    expect(codes).toContain('CM-SF');
    expect(codes).toContain('CM-DEMUX');
    expect(codes).toContain('CM-AUD');
    expect(codes).toContain('CM-VQ');
    expect(codes).toContain('CM-DSP');
  });

  it('generates accurate formatted version summaries and diagnostic payloads', () => {
    const summary = getSystemVersionSummary();
    expect(summary).toBe('OmniStream v1.5.2 [CM:v1.5.2, UT:v1.5.2]');

    const diagnostics = getVersionDiagnostics();
    expect(diagnostics['OmniStream Release']).toContain('v1.5.2');
    expect(diagnostics['CineMorph Product']).toBe('v1.5.2');
    expect(diagnostics['U-Tube Product']).toBe('v1.5.2');
    expect(diagnostics['Subsystem (CM-SF)']).toBe('Adaptive Smart Framing Engine v1.0.1');
    expect(diagnostics['Subsystem (CM-DEMUX)']).toBe('Lightweight Client-Side Stream Demuxer v1.0.0');
    expect(diagnostics['Subsystem (CM-AUD)']).toBe('Active Audio Routing & Hardware Stream Selector v1.0.1');
    expect(diagnostics['Subsystem (CM-VQ)']).toBe('Video & Frame Quality Intelligence v1.0.0');
    expect(diagnostics['Subsystem (CM-DSP)']).toBe('5-Band Parametric Audio DSP v1.0.0');
  });
});


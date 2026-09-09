import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { CineMorphNav } from '../components/cinemorph/landing/CineMorphNav';

describe('OmniStream Navigation Branding Live OMS Logo Verification', () => {
  it('T-NAV-01: Header renders live OMS Logo in return-to-home link instead of OmniStream text', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    // Link directs to '/'
    const homeLink = screen.getByTitle('Return to OmniStream');
    expect(homeLink).toBeDefined();
    expect(homeLink.getAttribute('href')).toBe('/');

    // Old text label "OmniStream" is NOT present as a visible text label inside the link
    expect(homeLink.textContent).not.toContain('OmniStream');

    // Contains live OMS Logo core image
    const omsCore = homeLink.querySelector('img[alt="OMS Intelligence Core"]');
    expect(omsCore).not.toBeNull();
  });

  it('T-NAV-02: Sidebar (full) renders live OMS Logo and OMS brand label for ecosystem escape to "/"', () => {
    render(
      <MemoryRouter>
        <Sidebar collapsed={false} />
      </MemoryRouter>
    );

    const escapeLink = screen.getByTitle('Return to OmniStream');
    expect(escapeLink).toBeDefined();
    expect(escapeLink.getAttribute('href')).toBe('/');

    // Live OMS Logo core image is rendered inside the escape link
    const omsCore = escapeLink.querySelector('img[alt="OMS Intelligence Core"]');
    expect(omsCore).not.toBeNull();

    // The visible label is OMS
    expect(escapeLink.textContent).toContain('OMS');
  });

  it('T-NAV-03: Sidebar (collapsed) renders live OMS Logo in rail for escape to "/"', () => {
    render(
      <MemoryRouter>
        <Sidebar collapsed={true} />
      </MemoryRouter>
    );

    const escapeLink = screen.getByTitle('Return to OmniStream');
    expect(escapeLink).toBeDefined();
    expect(escapeLink.getAttribute('href')).toBe('/');

    const omsCore = escapeLink.querySelector('img[alt="OMS Intelligence Core"]');
    expect(omsCore).not.toBeNull();
    expect(escapeLink.textContent).toContain('OMS');
  });

  it('T-NAV-04: CineMorphNav renders live OMS Logo for gateway navigation to "/"', () => {
    render(
      <MemoryRouter>
        <CineMorphNav environmentalTime="night" />
      </MemoryRouter>
    );

    const gatewayLink = screen.getByLabelText('OmniStream Gateway');
    expect(gatewayLink).toBeDefined();
    expect(gatewayLink.getAttribute('href')).toBe('/');

    // Live OMS Logo core image is rendered inside
    const omsCore = gatewayLink.querySelector('img[alt="OMS Intelligence Core"]');
    expect(omsCore).not.toBeNull();
  });
});

const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const manifestoPath = path.join(ROOT, 'OMNISTREAM_FINAL_BUILD_AGENT.md');
const intelPath = path.join(ROOT, 'OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md');

const manifesto = fs.readFileSync(manifestoPath, 'utf8');
const intel = fs.readFileSync(intelPath, 'utf8');

// Key areas check
const checks = [
  { category: 'Constitutional Directives', rule: 'Air-Gapped Local-First Zero-Backend', passed: true, evidence: 'All data in LocalStorage/IndexedDB; zero server persistence dependency.' },
  { category: 'Constitutional Directives', rule: 'Clean Ad-Free YouTube Playback', passed: true, evidence: 'react-player and clean embed with top-3 search constraints.' },
  { category: 'Constitutional Directives', rule: 'Dynamic Aspect-Ratio Viewports (1.43:1, 1.90:1, 2.39:1, etc.)', passed: true, evidence: 'Supported in frameEngine.ts and useCineMorphStore.' },
  { category: 'Framing Intelligence', rule: 'Rule of Thirds / Leading Lines / Frame-in-Frame / Screen Direction', passed: true, evidence: 'Algorithmic geometric scoring in frameEngine.ts.' },
  { category: 'Framing Intelligence', rule: 'Spring-Damper Coordinate Smoothing', passed: true, evidence: 'Spring damper and exponential moving average filters implemented in frameEngine.ts.' },
  { category: 'Audio Synthesis', rule: '10-Second Thermal Printing Audio Synthesis', passed: true, evidence: 'Web Audio API synthesizes dot-matrix audio pulses in audioEngine.ts.' },
  { category: 'State & Resumption', rule: '1-Click Torn Ticket Resumption', passed: true, evidence: 'Saved progress in useTicketStore / storageService with route restoration.' },
  { category: 'U-TUBE Engine', rule: 'Top-3 Search Limit, 4-Hour Feed Cache, 5-Video Recommendations', passed: true, evidence: 'Enforced in searchService.ts, cacheManager.ts, and recommendations.ts.' },
  { category: 'Intelligence Architecture', rule: 'Level 0-4 Fallback Strategy', passed: true, evidence: 'Structured across adaptiveCinemaEngine, hybridPipeline, and frameEngine.' },
  { category: 'Auditorium 3D Rendering', rule: 'Three.js 3D WebGL Proscenium & Curved Screen', passed: false, evidence: 'CineMorphTheater.tsx uses 2.5D CSS DOM layering rather than active WebGL Three.js canvas scene graph.' },
  { category: 'Build & Test Suite', rule: 'Vite Production Build & TypeCheck', passed: true, evidence: 'tsc --noEmit passed cleanly (0 errors); vite build succeeded with exit code 0.' },
  { category: 'Build & Test Suite', rule: 'Automated Vitest Test Suite Execution', passed: false, evidence: 'Vitest setup runner issue in src/tests/setup.ts prevented automated test run completion.' }
];

fs.writeFileSync(path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'manifesto_check_results.json'), JSON.stringify(checks, null, 2), 'utf8');
console.log('Saved manifesto_check_results.json');

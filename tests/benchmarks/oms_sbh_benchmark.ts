/**
 * oms_sbh_benchmark.ts - High-Precision OMS-SBH Performance Benchmarks
 * Measures microsecond latencies for Solver, Validator, Motion, Transition, DOM Adapter, and Full Pipeline.
 */

import {
  solveCineMorphGeometry as solveOMSGeometry,
  validateCineMorphGeometry as validateOMSGeometry,
  CineMorphSpringMotion as OMSTemporalSmoother,
  CineMorphTransitionEngine as OMSGeometryTransitionEngine,
  CineMorphDOMRenderer as OMSDOMRendererAdapter,
  CineMorphSpatialEngine as OMSSBHHarmonizer,
  OMSPresentationMode,
  OMSGeometryInput,
} from '../../src/products/cinemorph/spatial';

interface BenchmarkStats {
  iterations: number;
  totalMs: number;
  meanUs: number;
  medianUs: number;
  p95Us: number;
  p99Us: number;
  minUs: number;
  maxUs: number;
}

function calculateStats(samplesUs: number[]): BenchmarkStats {
  samplesUs.sort((a, b) => a - b);
  const n = samplesUs.length;
  const total = samplesUs.reduce((sum, v) => sum + v, 0);
  return {
    iterations: n,
    totalMs: Number((total / 1000).toFixed(3)),
    meanUs: Number((total / n).toFixed(2)),
    medianUs: Number(samplesUs[Math.floor(n * 0.5)].toFixed(2)),
    p95Us: Number(samplesUs[Math.floor(n * 0.95)].toFixed(2)),
    p99Us: Number(samplesUs[Math.floor(n * 0.99)].toFixed(2)),
    minUs: Number(samplesUs[0].toFixed(2)),
    maxUs: Number(samplesUs[n - 1].toFixed(2)),
  };
}

export function runOMSSBHBenchmarks(iterations: number = 10000): Record<string, BenchmarkStats> {
  const modes: OMSPresentationMode[] = ['original', '1.90', '1.43'];
  const testInputs: OMSGeometryInput[] = [
    { widthPx: 1920, heightPx: 1080, mode: 'original', seatsVisible: true, isFullscreen: false },
    { widthPx: 3840, heightPx: 2160, mode: '1.90', seatsVisible: true, isFullscreen: false },
    { widthPx: 1440, heightPx: 1080, mode: '1.43', seatsVisible: false, isFullscreen: true },
    { widthPx: 1920, heightPx: 800, mode: '1.90', seatsVisible: false, isFullscreen: false },
  ];

  // 1. Benchmark Geometry Solver
  const solverSamples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const input = testInputs[i % testInputs.length];
    const t0 = performance.now();
    solveOMSGeometry(input);
    const t1 = performance.now();
    solverSamples.push((t1 - t0) * 1000); // to microseconds
  }
  const solverStats = calculateStats(solverSamples);

  // Pre-generate states for Validator & DOM Adapter
  const sampleState = solveOMSGeometry(testInputs[0]);

  // 2. Benchmark Geometry Validator
  const validatorSamples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    validateOMSGeometry(sampleState);
    const t1 = performance.now();
    validatorSamples.push((t1 - t0) * 1000);
  }
  const validatorStats = calculateStats(validatorSamples);

  // 3. Benchmark Temporal Motion Smoother (Critically damped spring)
  const smoother = new OMSTemporalSmoother();
  const motionSamples: number[] = [];
  let ts = 1000;
  for (let i = 0; i < iterations; i++) {
    const targetCrop = { x: 0.1 + (i % 10) * 0.01, y: 0.1, width: 0.8, height: 0.8 };
    ts += 16.67;
    const t0 = performance.now();
    smoother.smooth(targetCrop, ts);
    const t1 = performance.now();
    motionSamples.push((t1 - t0) * 1000);
  }
  const motionStats = calculateStats(motionSamples);

  // 4. Benchmark Transition Engine
  const transitionEngine = new OMSGeometryTransitionEngine();
  const transitionSamples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    transitionEngine.transitionTo(sampleState, 600);
    const t1 = performance.now();
    transitionSamples.push((t1 - t0) * 1000);
  }
  const transitionStats = calculateStats(transitionSamples);

  // 5. Benchmark DOM Renderer Adapter
  const domSamples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const isFs = (i % 2) === 0;
    const t0 = performance.now();
    OMSDOMRendererAdapter.mapStateToStyles(sampleState, isFs);
    const t1 = performance.now();
    domSamples.push((t1 - t0) * 1000);
  }
  const domStats = calculateStats(domSamples);

  // 6. Benchmark Full Pipeline (Harmonizer: input -> intelligence -> solve -> validate -> smooth -> transition -> dom)
  const harmonizer = new OMSSBHHarmonizer();
  const fullPipelineSamples: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const mode = modes[i % modes.length];
    const seats = (i % 2) === 0;
    const t0 = performance.now();
    harmonizer.harmonize({
      widthPx: 1920,
      heightPx: 1080,
      mode,
      seatsVisible: seats,
      isFullscreen: false,
    });
    const t1 = performance.now();
    fullPipelineSamples.push((t1 - t0) * 1000);
  }
  const fullPipelineStats = calculateStats(fullPipelineSamples);

  return {
    geometrySolver: solverStats,
    geometryValidator: validatorStats,
    temporalMotionSmoother: motionStats,
    transitionEngine: transitionStats,
    domRendererAdapter: domStats,
    fullHarmonizerPipeline: fullPipelineStats,
  };
}

// If run directly
const results = runOMSSBHBenchmarks(10000);
console.log('=== OMS-SBH PERFORMANCE BENCHMARKS (10,000 iterations) ===');
for (const [subsystem, stats] of Object.entries(results)) {
  console.log(`\n[${subsystem.toUpperCase()}]`);
  console.log(`  Total Time:   ${stats.totalMs} ms (${stats.iterations} runs)`);
  console.log(`  Mean:         ${stats.meanUs} µs (${(stats.meanUs / 1000).toFixed(4)} ms)`);
  console.log(`  Median (p50): ${stats.medianUs} µs (${(stats.medianUs / 1000).toFixed(4)} ms)`);
  console.log(`  p95:          ${stats.p95Us} µs (${(stats.p95Us / 1000).toFixed(4)} ms)`);
  console.log(`  p99:          ${stats.p99Us} µs (${(stats.p99Us / 1000).toFixed(4)} ms)`);
  console.log(`  Min:          ${stats.minUs} µs`);
  console.log(`  Max:          ${stats.maxUs} µs (${(stats.maxUs / 1000).toFixed(4)} ms)`);
  const frameBudgetPercent = ((stats.meanUs / 1000) / 16.67) * 100;
  console.log(`  60fps Frame Budget: ${frameBudgetPercent.toFixed(3)}% of 16.67ms`);
}

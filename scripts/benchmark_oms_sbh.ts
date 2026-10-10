/**
 * benchmark_oms_sbh.ts - OMS-SBH Empirical Performance Benchmark
 * Runs 10,000 iterations to measure solver, validator, smoother, transition, renderer, and full pipeline.
 */

import { performance } from 'perf_hooks';
import {
  solveOMSGeometry,
  validateOMSGeometry,
  OMSTemporalSmoother,
  OMSGeometryTransitionEngine,
  OMSDOMRendererAdapter,
  OMSSBHHarmonizer,
} from '../src/products/cinemorph/sbh';

function calculateStats(samples: number[]) {
  samples.sort((a, b) => a - b);
  const sum = samples.reduce((acc, v) => acc + v, 0);
  const mean = sum / samples.length;
  const median = samples[Math.floor(samples.length * 0.5)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  const p99 = samples[Math.floor(samples.length * 0.99)];
  const worst = samples[samples.length - 1];
  return { mean, median, p95, p99, worst };
}

async function runBenchmark() {
  const ITERATIONS = 10000;
  console.log(`Starting OMS-SBH Performance Benchmark (${ITERATIONS} iterations)...`);

  const solverTimes: number[] = [];
  const validatorTimes: number[] = [];
  const motionTimes: number[] = [];
  const transitionTimes: number[] = [];
  const renderTimes: number[] = [];
  const fullPipelineTimes: number[] = [];

  const smoother = new OMSTemporalSmoother();
  const transitionEngine = new OMSGeometryTransitionEngine();
  const harmonizer = new OMSSBHHarmonizer();

  const sampleState = solveOMSGeometry({
    widthPx: 1920,
    heightPx: 1080,
    mode: '1.90',
    seatsVisible: true,
  });

  // Warmup (1,000 runs)
  for (let i = 0; i < 1000; i++) {
    const s = solveOMSGeometry({ widthPx: 1920, heightPx: 1080, mode: '1.90', seatsVisible: true });
    validateOMSGeometry(s);
    smoother.smooth(s.crop, Date.now());
    transitionEngine.transitionTo(s);
    OMSDOMRendererAdapter.mapStateToStyles(s, false);
    harmonizer.harmonize({ widthPx: 1920, heightPx: 1080, mode: '1.90', seatsVisible: true });
  }

  // Measurement Loop
  for (let i = 0; i < ITERATIONS; i++) {
    const mode = i % 3 === 0 ? 'original' : i % 3 === 1 ? '1.90' : '1.43';
    const seatsVisible = i % 2 === 0;

    // 1. Solver
    const t0 = performance.now();
    const solved = solveOMSGeometry({
      widthPx: 1920,
      heightPx: 1080,
      mode,
      seatsVisible,
      generation: i,
    });
    const t1 = performance.now();
    solverTimes.push(t1 - t0);

    // 2. Validator
    const t2 = performance.now();
    const validation = validateOMSGeometry(solved);
    const t3 = performance.now();
    validatorTimes.push(t3 - t2);

    // 3. Motion (Smoother)
    const t4 = performance.now();
    smoother.smooth(solved.crop, 1000 + i * 16.6);
    const t5 = performance.now();
    motionTimes.push(t5 - t4);

    // 4. Transition Engine
    const t6 = performance.now();
    transitionEngine.transitionTo(solved);
    const t7 = performance.now();
    transitionTimes.push(t7 - t6);

    // 5. DOM Renderer Adapter
    const t8 = performance.now();
    OMSDOMRendererAdapter.mapStateToStyles(solved, false);
    const t9 = performance.now();
    renderTimes.push(t9 - t8);

    // 6. Full Harmonization Pipeline
    const t10 = performance.now();
    harmonizer.harmonize({
      widthPx: 1920,
      heightPx: 1080,
      mode,
      seatsVisible,
    });
    const t11 = performance.now();
    fullPipelineTimes.push(t11 - t10);
  }

  const solverStats = calculateStats(solverTimes);
  const validatorStats = calculateStats(validatorTimes);
  const motionStats = calculateStats(motionTimes);
  const transitionStats = calculateStats(transitionTimes);
  const renderStats = calculateStats(renderTimes);
  const pipelineStats = calculateStats(fullPipelineTimes);

  console.log('\n--- OMS-SBH BENCHMARK RESULTS (in milliseconds) ---');
  console.table({
    '1. Solver (Pure O(1))': {
      Mean: solverStats.mean.toFixed(5),
      Median: solverStats.median.toFixed(5),
      p95: solverStats.p95.toFixed(5),
      p99: solverStats.p99.toFixed(5),
      Worst: solverStats.worst.toFixed(5),
    },
    '2. Validator (20 Invariants)': {
      Mean: validatorStats.mean.toFixed(5),
      Median: validatorStats.median.toFixed(5),
      p95: validatorStats.p95.toFixed(5),
      p99: validatorStats.p99.toFixed(5),
      Worst: validatorStats.worst.toFixed(5),
    },
    '3. Motion (Spring Smoother)': {
      Mean: motionStats.mean.toFixed(5),
      Median: motionStats.median.toFixed(5),
      p95: motionStats.p95.toFixed(5),
      p99: motionStats.p99.toFixed(5),
      Worst: motionStats.worst.toFixed(5),
    },
    '4. Transition Engine': {
      Mean: transitionStats.mean.toFixed(5),
      Median: transitionStats.median.toFixed(5),
      p95: transitionStats.p95.toFixed(5),
      p99: transitionStats.p99.toFixed(5),
      Worst: transitionStats.worst.toFixed(5),
    },
    '5. DOM Render Adapter': {
      Mean: renderStats.mean.toFixed(5),
      Median: renderStats.median.toFixed(5),
      p95: renderStats.p95.toFixed(5),
      p99: renderStats.p99.toFixed(5),
      Worst: renderStats.worst.toFixed(5),
    },
    '6. Full Harmonize Pipeline': {
      Mean: pipelineStats.mean.toFixed(5),
      Median: pipelineStats.median.toFixed(5),
      p95: pipelineStats.p95.toFixed(5),
      p99: pipelineStats.p99.toFixed(5),
      Worst: pipelineStats.worst.toFixed(5),
    },
  });

  // Frame budget budget analysis:
  // 60fps frame budget = 16.67ms
  // 120fps frame budget = 8.33ms
  const frameBudget60fps = 16.67;
  const frameBudget120fps = 8.33;
  console.log(`\nFrame budget headroom:`);
  console.log(`Full Pipeline Worst-case: ${pipelineStats.worst.toFixed(4)} ms`);
  console.log(`% of 60fps frame budget (16.67ms): ${(pipelineStats.worst / frameBudget60fps * 100).toFixed(2)}%`);
  console.log(`% of 120fps frame budget (8.33ms): ${(pipelineStats.worst / frameBudget120fps * 100).toFixed(2)}%`);
}

runBenchmark().catch(console.error);

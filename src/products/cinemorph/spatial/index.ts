/**
 * CineMorph Spatial Model — Master Public API
 * ============================================
 * Canonical, human-engineered spatial model and behavior engine for CineMorph Theater.
 * 
 * Submodules:
 * - entities: World entities, parameters, and geometry contracts
 * - solver: Closed-form constrained geometric optimization
 * - validator: Deterministic I1–I12 invariant verifier
 * - motion: Critically damped physical spring dynamics & transition engine
 * - renderer: Zero-React-render DOM CSS presentation adapter
 * - recovery: 4-level deterministic fail-safe recovery & freshness token lifecycle
 * - engine: CineMorphSpatialEngine master coordinator
 */

export * from './entities';
export * from './solver';
export * from './validator';
export * from './motion';
export * from './renderer';
export * from './recovery';
export * from './engine';
export * from './scenes';

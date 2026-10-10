/**
 * CineMorph Spatial Model — Invariant Verifier (I1–I12)
 * Pure deterministic validation verifying zero geometric violations before any motion or render execution.
 */

export * from '../../sbh/geometryValidator';
export { validateOMSGeometry as validateCineMorphGeometry } from '../../sbh/geometryValidator';

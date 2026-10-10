/**
 * CineMorph Spatial Model — Constraint & Optimization Solver
 * Closed-form analytical solver maximizing usable screen area under aperture, margin, and seat exclusion constraints.
 */

export * from '../../sbh/geometrySolver';
export { solveOMSGeometry as solveCineMorphGeometry } from '../../sbh/geometrySolver';

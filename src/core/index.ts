/**
 * OmniStream Core — Public API
 * ==============================
 * Cross-product infrastructure. Neither U-Tube nor CineMorph should modify this.
 * Shell and products may consume core. Core must never consume a product.
 *
 *   oms/       — OMS infrastructure (blazeface, capability resolver, model registry,
 *                perception normalizer, OMS standard, intent router, transition service)
 *   config/    — Version registry, environment configuration
 *   storage/   — Generic storage service (product-agnostic)
 *   security/  — Zero trust gateway
 *   platform/  — Device/environment detection
 */

export { storageService } from './storage/storageService';
export { omsTransitionService } from './oms/omsTransitionService';
export type { OMSTransitionContext } from './oms/omsTransitionService';

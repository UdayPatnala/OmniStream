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
export { omsTransitionService, OMSTransitionService } from './oms/omsTransitionService';
export type { OMSTransitionContext, IOMSTransitionDelegate, HandoffListener } from './oms/omsTransitionService';
export { errorRecoveryManager, ErrorRecoveryManager } from './oms/errorRecoveryManager';
export type { IErrorRecoveryDelegate } from './oms/errorRecoveryManager';
export { resolveExternalMediaMeta } from './oms/mediaResolver';
export type { ExternalMediaMeta } from './oms/mediaResolver';
export { IntentRouter } from './oms/intentRouter';
export type { IntentType, IntentResult, IIntentRouterStateProvider } from './oms/intentRouter';
export { ZeroTrustGateway } from './security/zeroTrustGateway';
export type { ValidationResult } from './security/zeroTrustGateway';
export { observabilityService } from './oms/observabilityService';
export type { TelemetryDiagnosticRecord } from './oms/observabilityService';
export {
  OMSCapabilityResolver,
} from './oms/capabilityResolver';
export type {
  CapabilityFailureType,
  ICapabilityTierDefinition,
  IResolutionDiagnostic,
} from './oms/capabilityResolver';
export { omsCapabilityDetector } from './oms/capabilityDetector';
export { OMSModelRegistry } from './oms/modelRegistry';
export {
  MediaPipeBlazeFaceAdapter,
} from './oms/blazeFaceAdapter';
export type { BlazeFaceAdapterOptions } from './oms/blazeFaceAdapter';
export { OMSFallbackRouter } from './oms/fallbackRouter';
export {
  PerceptionNormalizer,
  NullVisualPerceptionProvider,
  NullAudioPerceptionProvider,
} from './oms/perceptionNormalizer';
export {
  OMS_CACHE,
  OMS_VISION,
  OMS_DETECT,
  OMS_TRACK,
  OMS_SCENE,
  OMS_COMPOSE,
  OMS_GUARD,
} from './oms/omsStandard';
export * from './oms/interfaces';
export {
  SHORTCUT_DEFINITIONS,
  DEFAULT_SHORTCUTS,
  normalizeKey,
  formatKeyLabel,
  isModifierKey,
  matchesShortcut,
  findConflictingAction,
} from './shortcuts/shortcutManager';
export type { ShortcutAction, ShortcutDefinition } from './shortcuts/shortcutManager';
export {
  APP_VERSION,
  APP_VERSION_LABEL,
  APP_RELEASE_STATUS,
  APP_VERSION_METADATA,
} from './config/version';
export type { AppVersionMetadata } from './config/version';
export { VERSION_REGISTRY } from './config/versionRegistry';
export * from './audio';

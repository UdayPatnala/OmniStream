const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const jsonPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'code_inspection.json');
const raw = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(raw);

const manifestoPath = path.join(ROOT, 'OMNISTREAM_FINAL_BUILD_AGENT.md');
const manifesto = fs.existsSync(manifestoPath) ? fs.readFileSync(manifestoPath, 'utf8') : '';

const intelPath = path.join(ROOT, 'OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md');
const intel = fs.existsSync(intelPath) ? fs.readFileSync(intelPath, 'utf8') : '';

const report = {
  manifesto_length: manifesto.length,
  manifesto_lines: manifesto.split('\n').length,
  intel_length: intel.length,
  intel_lines: intel.split('\n').length,
  three_analysis: {
    theater_length: data.three_js.theater_length,
    theater_imports_three: data.three_js.theater_imports_three,
    theater_has_canvas: data.three_js.theater_has_canvas,
    theater_has_webgl: data.three_js.theater_has_webgl,
    visual_engine_imports_three: data.three_js.visual_engine_imports_three,
    smoke_test_imports_three: data.three_js.smoke_test_imports_three,
  },
  ml_analysis: {
    frame_engine_length: data.ml_engine.frame_engine_length,
    local_analyzer_length: data.ml_engine.local_analyzer_full ? data.ml_engine.local_analyzer_full.length : 0,
    hybrid_pipeline_length: data.ml_engine.hybrid_pipeline_full ? data.ml_engine.hybrid_pipeline_full.length : 0,
    model_registry_length: data.ml_engine.model_registry_full ? data.ml_engine.model_registry_full.length : 0,
    has_rule_of_thirds: data.ml_engine.frame_engine_full.includes('thirds') || data.ml_engine.frame_engine_full.includes('rule_of_thirds') || data.ml_engine.frame_engine_full.includes('ruleOfThirds'),
    has_leading_lines: data.ml_engine.frame_engine_full.includes('leading_lines') || data.ml_engine.frame_engine_full.includes('leadingLines'),
    has_frame_in_frame: data.ml_engine.frame_engine_full.includes('frame_in_frame') || data.ml_engine.frame_engine_full.includes('frameWithinFrame') || data.ml_engine.frame_engine_full.includes('frame_within_frame'),
    has_screen_direction: data.ml_engine.frame_engine_full.includes('screen_direction') || data.ml_engine.frame_engine_full.includes('screenDirection'),
    has_spring_damper: data.ml_engine.frame_engine_full.includes('spring') || data.ml_engine.frame_engine_full.includes('damping') || data.ml_engine.frame_engine_full.includes('lerp'),
  },
  audio_analysis: {
    audio_engine_length: data.audio_engine.audio_engine_full ? data.audio_engine.audio_engine_full.length : 0,
    has_audio_context: data.audio_engine.audio_engine_full.toLowerCase().includes('audiocontext'),
    has_oscillator: data.audio_engine.audio_engine_full.toLowerCase().includes('oscillator'),
    ticket_drawer_has_10s: data.audio_engine.ticket_drawer_full ? data.audio_engine.ticket_drawer_full.includes('10') : false
  },
  storage_analysis: {
    storage_service_length: data.storage.storage_service_full ? data.storage.storage_service_full.length : 0,
    has_localstorage: data.storage.storage_service_full ? data.storage.storage_service_full.includes('localStorage') : false,
    has_indexeddb: data.storage.storage_service_full ? data.storage.storage_service_full.toLowerCase().includes('indexeddb') : false
  },
  utube_analysis: {
    search_service_length: data.utube.search_service_full ? data.utube.search_service_full.length : 0,
    cache_manager_length: data.utube.cache_manager_full ? data.utube.cache_manager_full.length : 0,
    recommendations_length: data.utube.recommendations_full ? data.utube.recommendations_full.length : 0
  }
};

const outPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'deep_audit_summary.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('Deep audit summary saved to', outPath);

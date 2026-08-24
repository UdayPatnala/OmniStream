const fs = require('fs');
const path = require('path');

const ROOT = 'd:\\PROJECT\\AROH Open Source\\Products\\OmniStream';
const outPath = path.join(ROOT, '.agents', 'teamwork_preview_auditor_1', 'code_inspection.json');

function readFile(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

const theater_code = readFile('src/pages/CineMorphTheater.tsx');
const visual_engine = readFile('src/lib/cinemorph/visualEngine.ts');
const smoke_test = readFile('src/test/smoke.test.ts');
const three_test = readFile('src/tests/tier1-features/three-theater-scaling.test.ts');

const frame_engine = readFile('src/lib/cinemorph/frameEngine.ts');
const local_analyzer = readFile('src/lib/cinemorph/localVideoAnalyzer.ts');
const hybrid_pipeline = readFile('src/lib/ai/hybridPipeline.ts');
const model_registry = readFile('src/lib/ai/modelRegistry.ts');
const ml_test = readFile('src/tests/tier1-features/ml-framing-geometry.test.ts');

const audio_engine = readFile('src/lib/cinemorph/audioEngine.ts');
const ticket_store = readFile('src/state/useTicketStore.ts');
const ticket_drawer = readFile('src/components/bento/TicketDrawer.tsx');
const cinemorph_landing = readFile('src/pages/CineMorphLanding.tsx');
const ticket_test = readFile('src/tests/tier1-features/ticket-animation-heads-up.test.ts');
const resume_test = readFile('src/tests/tier1-features/ticket-save-resume.test.ts');

const storage_service = readFile('src/services/storageService.ts');
const storage_test = readFile('src/tests/tier1-features/local-storage-persistence.test.ts');

const search_service = readFile('src/lib/services/searchService.ts');
const cache_manager = readFile('src/lib/services/cacheManager.ts');
const recommendations = readFile('src/lib/recommendations.ts');
const utube_store = readFile('src/state/useUTubeStore.ts');

const data = {
  three_js: {
    theater_length: theater_code ? theater_code.length : 0,
    theater_imports_three: (theater_code || '').includes('three'),
    theater_has_canvas: (theater_code || '').toLowerCase().includes('<canvas'),
    theater_has_webgl: (theater_code || '').toLowerCase().includes('webgl'),
    visual_engine_imports_three: (visual_engine || '').includes('three'),
    smoke_test_imports_three: (smoke_test || '').includes('three'),
    visual_engine_full: visual_engine,
    three_test_full: three_test
  },
  ml_engine: {
    frame_engine_length: frame_engine ? frame_engine.length : 0,
    frame_engine_full: frame_engine,
    local_analyzer_full: local_analyzer,
    hybrid_pipeline_full: hybrid_pipeline,
    model_registry_full: model_registry,
    ml_test_full: ml_test
  },
  audio_engine: {
    audio_engine_full: audio_engine,
    ticket_drawer_full: ticket_drawer,
    cinemorph_landing_full: cinemorph_landing,
    ticket_test_full: ticket_test,
    resume_test_full: resume_test
  },
  storage: {
    storage_service_full: storage_service,
    ticket_store_full: ticket_store,
    storage_test_full: storage_test
  },
  utube: {
    search_service_full: search_service,
    cache_manager_full: cache_manager,
    recommendations_full: recommendations,
    utube_store_full: utube_store
  }
};

fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully wrote code_inspection.json');

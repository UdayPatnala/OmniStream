import os
import json
import re

ROOT = r"d:\PROJECT\AROH Open Source\Products\OmniStream"
SRC = os.path.join(ROOT, "src")

findings = {}

def read_file(path):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        return None
    with open(full, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()

# 1. Three.js inspection
theater_code = read_file("src/pages/CineMorphTheater.tsx")
visual_engine = read_file("src/lib/cinemorph/visualEngine.ts")
smoke_test = read_file("src/test/smoke.test.ts")
three_test = read_file("src/tests/tier1-features/three-theater-scaling.test.ts")

# 2. ML / Frame Engine inspection
frame_engine = read_file("src/lib/cinemorph/frameEngine.ts")
local_analyzer = read_file("src/lib/cinemorph/localVideoAnalyzer.ts")
hybrid_pipeline = read_file("src/lib/ai/hybridPipeline.ts")
model_registry = read_file("src/lib/ai/modelRegistry.ts")
ml_test = read_file("src/tests/tier1-features/ml-framing-geometry.test.ts")

# 3. Audio & Ticket
audio_engine = read_file("src/lib/cinemorph/audioEngine.ts")
ticket_store = read_file("src/state/useTicketStore.ts")
ticket_drawer = read_file("src/components/bento/TicketDrawer.tsx")
cinemorph_landing = read_file("src/pages/CineMorphLanding.tsx")
ticket_test = read_file("src/tests/tier1-features/ticket-animation-heads-up.test.ts")
resume_test = read_file("src/tests/tier1-features/ticket-save-resume.test.ts")

# 4. Storage
storage_service = read_file("src/services/storageService.ts")
storage_test = read_file("src/tests/tier1-features/local-storage-persistence.test.ts")

# 5. U-TUBE
search_service = read_file("src/lib/services/searchService.ts")
cache_manager = read_file("src/lib/services/cacheManager.ts")
recommendations = read_file("src/lib/recommendations.ts")
utube_store = read_file("src/state/useUTubeStore.ts")

data = {
    "three_js": {
        "theater_imports_three": "three" in (theater_code or ""),
        "theater_has_canvas": "<canvas" in (theater_code or "").lower(),
        "theater_has_webgl": "webgl" in (theater_code or "").lower(),
        "visual_engine_imports_three": "three" in (visual_engine or ""),
        "three_test_content": three_test[:1000] if three_test else None
    },
    "ml_engine": {
        "frame_engine_has_rules": {
            "rule_of_thirds": "third" in (frame_engine or "").lower(),
            "leading_lines": "leading" in (frame_engine or "").lower(),
            "frame_in_frame": "frame" in (frame_engine or "").lower(),
            "screen_direction": "direction" in (frame_engine or "").lower(),
            "spring_damper": "spring" in (frame_engine or "").lower() or "damp" in (frame_engine or "").lower()
        },
        "tfjs_imported_in_pipeline": "@tensorflow" in (hybrid_pipeline or "") or "tfjs" in (hybrid_pipeline or "").lower(),
        "tfjs_imported_in_analyzer": "@tensorflow" in (local_analyzer or "") or "tfjs" in (local_analyzer or "").lower(),
        "local_analyzer_summary": local_analyzer[:1500] if local_analyzer else None
    },
    "audio_engine": {
        "has_audio_context": "audiocontext" in (audio_engine or "").lower() or "webkitAudioContext" in (audio_engine or ""),
        "has_oscillator": "oscillator" in (audio_engine or "").lower(),
        "audio_engine_summary": audio_engine[:1500] if audio_engine else None
    },
    "storage": {
        "storage_service_summary": storage_service[:1500] if storage_service else None
    },
    "utube": {
        "search_service_summary": search_service[:1500] if search_service else None,
        "recommendations_summary": recommendations[:1500] if recommendations else None
    }
}

out_path = r"d:\PROJECT\AROH Open Source\Products\OmniStream\.agents\teamwork_preview_auditor_1\code_inspection.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)

print("Scan complete. Saved to", out_path)

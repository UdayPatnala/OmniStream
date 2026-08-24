import os
import re

ROOT = r"d:\PROJECT\AROH Open Source\Products\OmniStream"
SRC = os.path.join(ROOT, "src")

def inspect_file(rel_path):
    full_path = os.path.join(ROOT, rel_path)
    if not os.path.exists(full_path):
        return f"File not found: {rel_path}"
    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    lines = content.splitlines()
    return f"--- {rel_path} ({len(lines)} lines, {len(content)} bytes) ---\n" + "\n".join(lines[:100])

if __name__ == "__main__":
    targets = [
        "src/pages/CineMorphTheater.tsx",
        "src/lib/cinemorph/visualEngine.ts",
        "src/lib/cinemorph/frameEngine.ts",
        "src/lib/cinemorph/localVideoAnalyzer.ts",
        "src/lib/cinemorph/audioEngine.ts",
        "src/lib/cinemorph/adaptiveCinemaEngine.ts",
        "src/lib/ai/hybridPipeline.ts",
        "src/lib/services/searchService.ts",
        "src/services/storageService.ts"
    ]
    for t in targets:
        print(inspect_file(t))
        print("="*60)

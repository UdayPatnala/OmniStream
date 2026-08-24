import os

ROOT = r"d:\PROJECT\AROH Open Source\Products\OmniStream"

def inspect(name):
    p = os.path.join(ROOT, name)
    if not os.path.exists(p):
        return f"File {name} not found"
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        c = f.read()
    return f"=== {name} ({len(c.splitlines())} lines) ===\n" + c

output = ""
for f in ["OMNISTREAM_FINAL_BUILD_AGENT.md", "OMNISTREAM_INTELLIGENCE_ARCHITECTURE.md"]:
    output += inspect(f) + "\n\n"

out_file = os.path.join(ROOT, ".agents", "teamwork_preview_auditor_1", "manifesto_intelligence_analysis.txt")
with open(out_file, "w", encoding="utf-8") as f:
    f.write(output)

print("Wrote analysis to", out_file)

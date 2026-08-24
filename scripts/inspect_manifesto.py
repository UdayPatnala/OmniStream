import os

ROOT = r"d:\PROJECT\AROH Open Source\Products\OmniStream"
p = os.path.join(ROOT, "OMNISTREAM_FINAL_BUILD_AGENT.md")
if os.path.exists(p):
    with open(p, "r", encoding="utf-8", errors="ignore") as f:
        manifesto = f.read()
    print(f"Manifesto length: {len(manifesto)} bytes, {len(manifesto.splitlines())} lines")
    print(manifesto[:2500])
else:
    print("Manifesto file not found!")

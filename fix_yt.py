import re
with open('src/lib/youtube.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'export const FALLBACK_VIDEOS: Video\[\] = \[.*?\];', 'export const FALLBACK_VIDEOS: Video[] = [];', content, flags=re.DOTALL)

with open('src/lib/youtube.ts', 'w', encoding='utf-8') as f:
    f.write(content)

import re

with open('src/pages/CineMorphTheater.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Main container bg
content = content.replace('bg-[#020205]', 'bg-[#f8f5f0]')

# 2. Text colors from white to amber-950 where appropriate in the main wrapper
content = re.sub(r'text-white( flex flex-col items-center justify-center overflow-hidden)', r'text-[#3d332a]\1', content)

# 3. Controls panel background
content = content.replace('bg-[#090712]/90 backdrop-blur-2xl border border-white/10', 'bg-[#f8f5f0]/95 backdrop-blur-2xl border border-amber-900/20 text-[#3d332a]')
content = content.replace('shadow-[0_20px_50px_rgba(0,0,0,0.9)]', 'shadow-[0_20px_50px_rgba(120,53,15,0.2)]')

# 4. Remove w-full from the hole so aspect ratio works
content = content.replace('w-full max-w-[98vw] max-h-[84vh]', 'max-w-[98vw] max-h-[84vh] h-full')
content = content.replace('w-full max-w-[94vw] max-h-[78vh]', 'max-w-[94vw] max-h-[78vh] h-full')

# 5. Make the video object-cover so it fills the hole and we can pan/zoom
content = content.replace('className={w-full h-full }', 'className="w-full h-full object-cover"')

# 6. Change top right button
content = content.replace('bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-xs font-bold text-indigo-300 shadow-xl shadow-indigo-950/50', 'bg-amber-100/80 hover:bg-amber-200 border border-amber-900/20 text-xs font-bold text-amber-900 shadow-xl shadow-amber-900/10')
content = content.replace('text-cyan-400', 'text-amber-700')
content = content.replace('text-cyan-300', 'text-amber-800')
content = content.replace('border-cyan-500/40', 'border-amber-900/20')
content = content.replace('bg-cyan-500', 'bg-amber-600')

with open('src/pages/CineMorphTheater.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

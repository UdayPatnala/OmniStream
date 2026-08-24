import re

with open('src/pages/CineMorphTheater.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'text-white': 'text-[#3d332a]',
    'text-gray-400': 'text-amber-900/60',
    'text-gray-300': 'text-amber-900/80',
    'border-white/10': 'border-amber-900/10',
    'border-white/5': 'border-amber-900/5',
    'bg-white/10': 'bg-amber-900/10',
    'bg-white/20': 'bg-amber-900/20',
    'bg-white/5': 'bg-amber-900/5',
    'hover:bg-white/10': 'hover:bg-amber-900/10',
    'hover:bg-white/20': 'hover:bg-amber-900/20',
    'hover:text-white': 'hover:text-amber-950',
    'text-cyan-400': 'text-amber-700',
    'text-cyan-300': 'text-amber-800',
    'border-cyan-500/40': 'border-amber-900/20',
    'border-cyan-500/30': 'border-amber-900/20',
    'bg-cyan-600': 'bg-amber-700',
    'shadow-cyan-600/30': 'shadow-amber-900/20',
    'bg-purple-600': 'bg-amber-800',
    'shadow-purple-600/30': 'shadow-amber-900/20',
    'bg-[#020205]/95': 'bg-[#f8f5f0]/95',
    'text-amber-400': 'text-amber-800',
    'bg-[#13111f]': 'bg-white',
    'text-[#3d332a]/10': 'border-amber-900/10'
}

for old, new_val in replacements.items():
    content = content.replace(old, new_val)

# Fix the hole bg back to black because we need letterboxing to be black
content = content.replace('bg-[#3d332a]/95 backdrop-blur-2xl', 'bg-[#f8f5f0]/95 backdrop-blur-2xl') # Fix if accidentally replaced
content = content.replace('bg-black/60', 'bg-amber-900/5')
content = content.replace('bg-black/80', 'bg-white/90')

with open('src/pages/CineMorphTheater.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

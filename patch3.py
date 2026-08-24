import re

with open('src/pages/CineMorphTheater.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure useTicketStore is imported in CineMorphTheater.tsx
if 'useTicketStore' not in content:
    content = content.replace("import { useAppStore } from '../store';", "import { useAppStore } from '../store';\nimport { useTicketStore } from '../state/useTicketStore';")

# Find the onClick for recommendations
content = content.replace('''                      onClick={() => {
                        setNextUpCountdown(null);
                        useAppStore.getState().setActiveVideo(rec);
                        setShowIntroBumper(false);
                        setTheaterState('playing');
                        setPlaying(true);
                        navigate(/theater/);
                      }}''', '''                      onClick={async () => {
                        setNextUpCountdown(null);
                        useAppStore.getState().setActiveVideo(rec);
                        setShowIntroBumper(false);
                        setTheaterState('paused');
                        setPlaying(false);
                        await useTicketStore.getState().trigger10sPrintAnimation({
                          title: rec.title,
                          source: rec.id,
                          isLocal: false
                        });
                        setTheaterState('playing');
                        setPlaying(true);
                        navigate(/theater/);
                      }}''')

with open('src/pages/CineMorphTheater.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

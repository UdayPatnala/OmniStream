# Workspace Rule: CineMorph V2 Adaptive Large-Format Intelligent Screen Engine

## Core Philosophy & Mental Model
1. **Fixed Aperture / Video Plane Model ("Box With A Hole")**:
   - The virtual cinema screen maintains a fixed visible aperture frame (`1.43:1`, `1.90:1`, `16:9`).
   - The original video plane exists *behind* the visible aperture.
   - The video plane transforms (`scale`, `translateY`) behind the aperture ONLY when necessary to prioritize visual subjects (faces, people, objects, leadroom, text/subtitles).
2. **3 Core Modes**:
   - `original`: Source baseline, zero ML crop or automatic repositioning.
   - `1.43:1`: Vertical Immersive Large-Format Aperture.
   - `1.90:1`: Wide Immersive Large-Format Aperture.
3. **Hard Safety Constraints**:
   - **No Aspect Distortion**: Non-uniform scaling is strictly forbidden.
   - **Subtitle Safe Mode**: When subtitles/captions are active, smart crop is instantly bypassed to preserve text readability (`scale = 1.0, translateY = 0%`).
   - **Low Confidence Fallback**: If confidence < `0.60`, revert to original framing.
   - **Sticky Hysteresis & Anti-Jitter**: Micro-shifts (< 3.5% delta) are ignored; candidate updates require a +15% improvement score before moving.

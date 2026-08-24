# OmniStream Architecture & Technical Engineering Study
**Author**: Explorer 3 (Graphics, ML & Testing Architecture Specialist)  
**Date**: 2026-08-23  
**Status**: Survey Specification & Technical Design  
**Workspace**: `d:\PROJECT\AROH Open Source\Products\OmniStream`

---

## Executive Summary

OmniStream integrates two distinct paradigms into a unified, zero-backend, client-first web application:
1. **U-TUBE**: A lightweight, ad-free YouTube client with clean discovery, search persistence, and channel management.
2. **CineMorph**: A high-fidelity 3D virtual theater hall powered by Three.js, featuring client-side real-time ML-guided dynamic framing geometry, vintage paper-themed ticket printing workflows, and spatial audio DSP.

This document details the architectural blueprints, mathematical models, shader pipelines, ML inference loops, diagnostic visualizers, ticket state machines, and end-to-end testing strategies required to deliver a 60 FPS, zero-latency desktop cinema experience.

---

## 1. CineMorph Three.js Scene Graph & 3D Environment Architecture

```
                                +---------------------------+
                                |      Three.js Scene       |
                                +-------------+-------------+
                                              |
      +-------------------+-------------------+-------------------+-------------------+
      |                   |                   |                   |                   |
+-----+------+      +-----+------+      +-----+------+      +-----+------+      +-----+------+
|   Camera   |      | Screen     |      | Proscenium |      | Auditorium |      | Atmospheric|
|   Rig      |      | Geometry   |      | & Curtains |      | Seating    |      | Lighting   |
+------------+      +------------+      +------------+      +------------+      +------------+
```

### 1.1 Curved Screen Geometry & Mathematical Model

In standard flat displays, wide-angle cinematic projection suffers from peripheral perspective distortion. To simulate the immersive curvature of IMAX 70mm and Laser domes, the projection screen is modeled as a cylindrical section with toroidal edge concavity.

#### Parametric Mesh Formulation
Let the screen coordinate space be defined by normalized coordinates $(u, v) \in [0, 1] \times [0, 1]$.
Given:
- Chord width $W = 18.0\text{ m}$
- Screen height $H = W / A_{\text{target}}$ where $A_{\text{target}} \in \{1.43, 1.90, 2.39, 1.77\}$
- Radius of curvature $R = 12.0\text{ m}$
- Subtended arc angle $\Theta = 2 \arcsin\left(\frac{W}{2R}\right) \approx 1.696\text{ rad} \approx 97.2^\circ$

The 3D vertex position $\mathbf{P}(u, v) = (X, Y, Z)$ is generated parametrically by:
$$X(u, v) = R \cdot \sin\left(\left(u - \frac{1}{2}\right) \Theta\right)$$
$$Y(u, v) = \left(v - \frac{1}{2}\right) H - \kappa_y \left(u - \frac{1}{2}\right)^2$$
$$Z(u, v) = -R \cdot \left(1 - \cos\left(\left(u - \frac{1}{2}\right) \Theta\right)\right)$$

Where $\kappa_y \approx 0.15$ introduces subtle vertical toroidal sag matching genuine IMAX screens.

#### VideoTexture Mapping & Distortion Correction
To ensure the 2D video stream maps onto the curved surface without tangential stretching:
```typescript
import * as THREE from 'three';

export function createCurvedScreenMesh(
  width: number = 18, 
  aspectRatio: number = 1.43, 
  radius: number = 12, 
  segmentsX: number = 64, 
  segmentsY: number = 32
): THREE.Mesh {
  const height = width / aspectRatio;
  const geometry = new THREE.BufferGeometry();
  const theta = 2 * Math.asin(width / (2 * radius));
  
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  
  for (let y = 0; y <= segmentsY; y++) {
    const v = y / segmentsY;
    const yPos = (v - 0.5) * height;
    
    for (let x = 0; x <= segmentsX; x++) {
      const u = x / segmentsX;
      const angle = (u - 0.5) * theta;
      
      const xPos = radius * Math.sin(angle);
      const zPos = -radius * (1 - Math.cos(angle));
      
      positions.push(xPos, yPos, zPos);
      uvs.push(u, 1.0 - v);
    }
  }
  
  for (let y = 0; y < segmentsY; y++) {
    for (let x = 0; x < segmentsX; x++) {
      const a = y * (segmentsX + 1) + x;
      const b = a + (segmentsX + 1);
      const c = a + 1;
      const d = b + 1;
      indices.push(a, b, c);
      indices.push(c, b, d);
    }
  }
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const videoTexture = new THREE.VideoTexture(videoElement);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.generateMipmaps = false;
  videoTexture.colorSpace = THREE.SRGBColorSpace;

  const material = new THREE.MeshStandardMaterial({
    map: videoTexture,
    roughness: 0.15,
    metalness: 0.0,
    emissive: new THREE.Color(0x050505),
    side: THREE.FrontSide,
  });

  return new THREE.Mesh(geometry, material);
}
```

### 1.2 Aspect Ratio Clipping & Dynamic Aperture Reconfiguration

OmniStream CineMorph supports continuous transitions between:
- **IMAX GT 70mm (1.43:1)**: Full-height aperture, maximized vertical FOV.
- **IMAX Digital (1.90:1)**: Expanded widescreen aperture.
- **Scope / Anamorphic (2.39:1)**: Letterbox ultra-wide.
- **Original Source Ratio (16:9 / variable)**: Unmodified native framing.
- **Degraded Fallback (4:3)**: Low-power or offline safety crop.

#### Dynamic UV Matrix Transformation
Rather than rebuilding mesh vertices at runtime, aspect adjustments and panning offsets are executed via GPU UV transformation matrices:
$$\begin{bmatrix} u' \\ v' \\ 1 \end{bmatrix} = \begin{bmatrix} S_u & 0 & T_u \\ 0 & S_v & T_v \\ 0 & 0 & 1 \end{bmatrix} \begin{bmatrix} u \\ v \\ 1 \end{bmatrix}$$
Where:
- $S_u, S_v$: Scaling factors determined by the target aspect ratio vs video native aspect ratio.
- $T_u, T_v$: Normalized panning offsets $(-0.5 \le T_u, T_v \le 0.5)$ generated by the ML Framing Engine.

```typescript
export function updateScreenAperture(
  texture: THREE.VideoTexture,
  sourceAspect: number,
  targetAspect: number,
  panX: number, // Normalized -1.0 to +1.0
  panY: number
) {
  let scaleX = 1.0;
  let scaleY = 1.0;

  if (sourceAspect > targetAspect) {
    // Video is wider than screen: crop sides, allow horizontal panning
    scaleX = targetAspect / sourceAspect;
    scaleY = 1.0;
  } else {
    // Video is taller than screen: crop top/bottom, allow vertical panning
    scaleX = 1.0;
    scaleY = sourceAspect / targetAspect;
  }

  // Calculate clamp range for pan offset to prevent empty borders
  const maxOffsetX = (1.0 - scaleX) / 2;
  const maxOffsetY = (1.0 - scaleY) / 2;

  const clampedPanX = Math.max(-maxOffsetX, Math.min(maxOffsetX, panX * maxOffsetX));
  const clampedPanY = Math.max(-maxOffsetY, Math.min(maxOffsetY, panY * maxOffsetY));

  texture.matrixAutoUpdate = false;
  texture.matrix.setUvTransform(
    (1 - scaleX) / 2 + clampedPanX,
    (1 - scaleY) / 2 + clampedPanY,
    scaleX,
    scaleY,
    0, // Rotation
    0.5, 0.5 // Center pivot
  );
}
```

### 1.3 Stadium Seating & Proscenium Architecture

#### Instanced Auditorium Seating (InstancedMesh)
Rendering 120+ individual theater chairs with traditional draw calls exhausts the GPU render budget. By utilizing `THREE.InstancedMesh`, all seats across 6 tiered, radial rows are submitted in a single draw call.

- **Seat Geometry**: Low-poly ergonomic armchair model with rounded headrest, armrests, and cup holders (approx. 240 triangles per seat).
- **Seat Placement Matrix**: Arranged in concentric arcs focused toward the screen center:
  $$R_{\text{row}}(i) = R_0 + i \cdot \Delta R, \quad \theta_{\text{seat}}(j) = \theta_{\min} + j \cdot \Delta \theta, \quad Y_{\text{tier}}(i) = Y_0 + i \cdot \Delta Y$$
- **Material**: Deep crimson velvet (`#1a0408`) with subtle fabric sheen (`roughness = 0.82`, `metalness = 0.08`, `sheen = 0.6`).

#### Velvet Curtains & Proscenium Shutter
- **Geometry**: Parametric corrugated pleated mesh.
- **Opening Animation**: Smooth sine-based accordion lateral compression driven by uniform `uCurtainOpen` $(0.0 \to 1.0)$ using a custom vertex shader:
  $$x_{\text{vertex}}' = x_{\text{anchor}} + (x_{\text{vertex}} - x_{\text{anchor}}) \cdot (1.0 - 0.85 \cdot u_{\text{open}})$$

### 1.4 Atmospheric Lighting & Dynamic Ambilight Bloom

To deliver photorealistic theater presence without overwhelming frame times:
1. **Dynamic Screen Backlight (Ambilight)**:
   - A `THREE.RectAreaLight` positioned immediately behind the screen perimeter emits softly onto the side acoustic wall baffles.
   - Light color is dynamically updated every $200\text{ms}$ by sampling the downscaled video canvas through a low-pass temporal RGB filter.
2. **Floor Aisle & Step Lights**:
   - Low-intensity cyan/amber micro-LED strips along carpet aisle edges using emissive instance attributes.
3. **Volumetric Projector Beam**:
   - Inverted cone mesh from the projection booth $(Z = 16\text{m})$ to the screen $(Z = 0)$ using `THREE.AdditiveBlending` and an animated noise shader with dusty particle shimmer.

### 1.5 Camera Controls, Parallax & 60 FPS Optimizations

| Component | Target Spec | Optimization Strategy |
|---|---|---|
| **Camera FOV** | $65^\circ$ vertical | Positioned at optimal VIP row D $(Z = 8.5\text{m}, Y = 0.8\text{m})$ |
| **Parallax Rig** | $\pm 12^\circ$ yaw, $\pm 6^\circ$ pitch | Damped mouse/gyro parallax with spring physics $(k = 0.08, d = 0.85)$ |
| **Draw Calls** | $< 12$ calls / frame | InstancedMesh for seats, shared materials, geometry merging |
| **Texture Uploads**| Conditional `needsUpdate` | Upload only when `video.currentTime` changes; bypass when paused |
| **Render Throttling** | Adaptive DPR | `Math.min(window.devicePixelRatio, 1.5)`, half-resolution shadow maps |

---

## 2. Advanced Framing Geometry ML Pipeline

```
+--------------------------------------------------------------------------------+
|                             Client-Side Pipeline                               |
|                                                                                |
|  +--------------+    Zero-Copy      +----------------+   Inference Loop        |
|  | HTML5 Video  | ----------------> | OffscreenCanvas| ------------+           |
|  | Element      |  transferToImage  | & Web Worker   |             |           |
|  +--------------+                   +----------------+             v           |
|                                                              +-------------+   |
|  +--------------+                   +----------------+       | ML Models   |   |
|  | Three.js     | <---------------- | Smoothing &    | <-----+ (BlazeFace/ |   |
|  | Screen UV    |    Pan Offset     | Deadzone       |       | Saliency/   |   |
|  +--------------+    (X, Y)         | Hysteresis     |       | Edge Line)  |   |
|                                     +----------------+       +-------------+   |
+--------------------------------------------------------------------------------+
```

### 2.1 Model Architecture & Inference Strategy

OmniStream implements a multi-tiered, zero-network-cost edge inference pipeline designed to run 100% locally in the user's browser.

#### Tier 1: BlazeFace / MediaPipe Lightweight Face & Pose Detection (TFLite WebAssembly/WebGL)
- **Model Payload**: Quantized lightweight model ($\approx 380\text{ KB}$ weights).
- **Latency**: $3.5 - 6.0\text{ ms}$ on WebGL backend.
- **Outputs**: Normalized bounding boxes $[x_{\min}, y_{\min}, x_{\max}, y_{\max}]$, 6 facial keypoints (left eye, right eye, nose tip, mouth center, left ear, right ear), confidence score $\sigma \in [0, 1]$.

#### Tier 2: Real-Time Saliency & Gradient Edge Matrix (Pure Canvas / Web Worker Fallback)
When hardware acceleration is constrained or offline without loaded model weights:
- Fast $32 \times 18$ grid luminance sampling with Sobel $3 \times 3$ convolution kernels:
  $$G_x = \begin{bmatrix} -1 & 0 & 1 \\ -2 & 0 & 2 \\ -1 & 0 & 1 \end{bmatrix} * I, \quad G_y = \begin{bmatrix} -1 & -2 & -1 \\ 0 & 0 & 0 \\ 1 & 2 & 1 \end{bmatrix} * I$$
  $$M(x, y) = \sqrt{G_x^2 + G_y^2}$$

### 2.2 Mathematical Formulations of Framing Rules

```
+-------------------+-------------------+-------------------+
|                   |                   |                   |
|     (1/3, 1/3)    |     Center        |    (2/3, 1/3)     |
|         +         |        +          |         +         |
|         |         |                   |         |         |
+---------|---------+-------------------+---------|---------+
|         v                             |         v         |
|   Subject Look-Right                  |   Subject Look-Left |
|   (Lead Room Right)                   |   (Lead Room Left)  |
|                                       |                     |
+-------------------+-------------------+-------------------+
```

#### Rule 1: Rule of Thirds Alignment
Cinematic composition dictates placing primary focal elements (such as actor eye-lines) along the upper horizontal third ($y = 1/3$) and lateral power intersections $(x = 1/3$ or $x = 2/3$).

Let detected subject centroid be $C = (x_c, y_c)$ and eye-line height be $y_{\text{eyes}}$.
The target horizontal anchor $x_{\text{target}}$ is chosen as:
$$x_{\text{target}} = \begin{cases} 1/3 & \text{if } x_c \le 0.5 \\ 2/3 & \text{if } x_c > 0.5 \end{cases}$$
The raw horizontal and vertical compensation panning offsets are:
$$\Delta X_{\text{thirds}} = x_c - x_{\text{target}}$$
$$\Delta Y_{\text{thirds}} = y_{\text{eyes}} - \frac{1}{3}$$

#### Rule 2: Screen Direction & Lead Room (Gaze / Motion Vector Compensation)
When a character looks or moves toward one side of the frame, the camera must pan ahead of their gaze/movement to provide visual "lead room" (nose room).

Given eye positions $E_{\text{left}} = (x_{el}, y_{el})$ and $E_{\text{right}} = (x_{er}, y_{er})$ and nose tip $N = (x_n, y_n)$:
1. Calculate the yaw orientation angle $\theta_{\text{gaze}}$:
   $$\Delta x_{\text{eye}} = x_{er} - x_{el}, \quad x_{\text{mid}} = \frac{x_{el} + x_{er}}{2}$$
   $$\theta_{\text{gaze}} = \arcsin\left(\frac{x_n - x_{\text{mid}}}{\Delta x_{\text{eye}} / 2}\right)$$
2. Lead room adjustment vector:
   $$\text{LeadOffset}_X = -\text{clamp}\left(\sin(\theta_{\text{gaze}}) \cdot K_{\text{lead}}, -0.15, 0.15\right)$$
   Where $K_{\text{lead}} = 0.18$.

#### Rule 3: Leading Lines & Vanishing Point Optimization
For architectural and landscape compositions, linear perspective convergence points guide gaze.
1. Dominant lines extracted via Hough Transform: $\rho = x \cos \theta + y \sin \theta$.
2. Vanishing point $V = (x_v, y_v)$ computed by solving the intersection of non-horizontal lines ($|\theta| \notin [85^\circ, 95^\circ]$) using Singular Value Decomposition (SVD).
3. Pan offset gently biases towards centering $V$ along the golden section ($x = 0.5, y = 0.382$):
   $$\Delta X_{\text{lines}} = V_x - 0.5, \quad \Delta Y_{\text{lines}} = V_y - 0.382$$

#### Rule 4: Frame-in-Frame Aperture Tracking
When natural framing elements (doorways, arches, vehicle windows) are detected via high-contrast rectangular edge loops $R = [x_{\min}, y_{\min}, x_{\max}, y_{\max}]$:
- The crop scale $S$ and translation $(T_x, T_y)$ dynamically zoom to nest the proscenium precisely within the identified sub-aperture.

### 2.3 Smoothing Filters & Saccade Hysteresis

To eliminate jerky camera motion and camera hunting during static dialogue scenes:

```typescript
export class CinematicFramingFilter {
  private currentPanX = 0.0;
  private currentPanY = 0.0;
  private velocityX = 0.0;
  private velocityY = 0.0;

  // Configuration Constants
  private readonly DEADZONE_THRESHOLD = 0.035; // 3.5% frame displacement threshold
  private readonly SPRING_TENSION = 0.12;      // Smooth pursuit tracking stiffness
  private readonly DAMPING = 0.82;              // Critically damped decay
  private readonly SCENE_CUT_THRESHOLD = 0.45;  // Histogram delta threshold

  public process(
    targetX: number,
    targetY: number,
    confidence: number,
    isSceneCut: boolean
  ): { panX: number; panY: number } {
    if (isSceneCut || confidence < 0.5) {
      // Hard scene cut or lost confidence: instantaneous snap/reset without glide
      this.currentPanX = isSceneCut ? targetX : 0.0;
      this.currentPanY = isSceneCut ? targetY : 0.0;
      this.velocityX = 0.0;
      this.velocityY = 0.0;
      return { panX: this.currentPanX, panY: this.currentPanY };
    }

    // 1. Deadzone Hysteresis
    const deltaX = targetX - this.currentPanX;
    const deltaY = targetY - this.currentPanY;
    const displacement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (displacement < this.DEADZONE_THRESHOLD) {
      // Sub-threshold movement: hold steady (emulate locked tripod)
      this.velocityX *= 0.7;
      this.velocityY *= 0.7;
    } else {
      // 2. Spring-Damper Pursuit
      const forceX = deltaX * this.SPRING_TENSION;
      const forceY = deltaY * this.SPRING_TENSION;

      this.velocityX = (this.velocityX + forceX) * this.DAMPING;
      this.velocityY = (this.velocityY + forceY) * this.DAMPING;

      this.currentPanX += this.velocityX;
      this.currentPanY += this.velocityY;
    }

    // Clamp within safety boundaries (-0.5 to +0.5)
    this.currentPanX = Math.max(-0.45, Math.min(0.45, this.currentPanX));
    this.currentPanY = Math.max(-0.45, Math.min(0.45, this.currentPanY));

    return { panX: this.currentPanX, panY: this.currentPanY };
  }
}
```

---

## 3. Diagnostic Overlay Implementation for Framing Visualization

The diagnostic HUD provides real-time mathematical transparency into the ML engine's composition decisions.

```
+------------------------------------------------------------------------------+
| [DIAGNOSTIC HUD]  FPS: 59.8 | LATENCY: 4.2ms | RULE: RULE OF THIRDS + LEAD   |
|                   PAN: X=+0.12, Y=-0.04 | CONFIDENCE: 96.4%                  |
|                                                                              |
|       |         |         |                                                  |
|  - - -+---------+---------+ - - -                                            |
|       |  [Face #1]        |  --> Gaze Vector (+28°)                         |
|       |  (96.4%)          |                                                  |
|       |    + Reticle      |                                                  |
|  - - -+---------+---------+ - - -                                            |
|       |   Leading Lines   |                                                  |
|       |   /     |     \   |                                                  |
|       |  /      |      \  |                                                  |
+------------------------------------------------------------------------------+
```

### 3.1 Overlay Layer Architecture
Implemented as a transparent Canvas 2D overlay positioned directly over the Three.js viewport:

```typescript
export interface DiagnosticFrameData {
  fps: number;
  inferenceTimeMs: number;
  activeRule: 'Rule of Thirds' | 'Leading Lines' | 'Frame-in-Frame' | 'Screen Direction' | 'Center Neutral';
  confidence: number;
  panOffset: { x: number; y: number };
  detectedFaces: Array<{
    bbox: [number, number, number, number]; // [x, y, w, h] normalized
    landmarks: { eyes: [number, number][]; nose: [number, number]; mouth: [number, number] };
    gazeAngleDeg: number;
  }>;
  leadingLines: Array<{ start: [number, number]; end: [number, number] }>;
  vanishingPoint: [number, number] | null;
  cropRect: [number, number, number, number];
}

export function renderDiagnosticOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: DiagnosticFrameData
) {
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Rule of Thirds & Golden Ratio Grid
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.25)'; // Cyan
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  const thirdX1 = width / 3;
  const thirdX2 = (width * 2) / 3;
  const thirdY1 = height / 3;
  const thirdY2 = (height * 2) / 3;

  ctx.beginPath();
  ctx.moveTo(thirdX1, 0); ctx.lineTo(thirdX1, height);
  ctx.moveTo(thirdX2, 0); ctx.lineTo(thirdX2, height);
  ctx.moveTo(0, thirdY1); ctx.lineTo(width, thirdY1);
  ctx.moveTo(0, thirdY2); ctx.lineTo(width, thirdY2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Draw Detected Subject Bounding Boxes & Gaze Rays
  for (const face of data.detectedFaces) {
    const [bx, by, bw, bh] = [
      face.bbox[0] * width,
      face.bbox[1] * height,
      face.bbox[2] * width,
      face.bbox[3] * height,
    ];

    // Bounding Box
    ctx.strokeStyle = '#ec4899'; // Pink
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Focal Reticle Crosshair
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    ctx.strokeStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy);
    ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy + 10);
    ctx.stroke();

    // Gaze Direction Ray
    const rayLength = 60;
    const rad = (face.gazeAngleDeg * Math.PI) / 180;
    ctx.strokeStyle = '#f59e0b'; // Amber
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(rad) * rayLength, cy + Math.sin(rad) * rayLength);
    ctx.stroke();
  }

  // 3. Draw Leading Lines & Vanishing Point
  if (data.vanishingPoint) {
    const [vx, vy] = [data.vanishingPoint[0] * width, data.vanishingPoint[1] * height];
    ctx.fillStyle = '#a855f7'; // Purple
    ctx.beginPath();
    ctx.arc(vx, vy, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
    for (const line of data.leadingLines) {
      ctx.beginPath();
      ctx.moveTo(line.start[0] * width, line.start[1] * height);
      ctx.lineTo(vx, vy);
      ctx.stroke();
    }
  }

  // 4. Telemetry Glassmorphic Dashboard HUD
  ctx.fillStyle = 'rgba(9, 7, 18, 0.85)';
  ctx.strokeStyle = 'rgba(34, 211, 238, 0.3)';
  ctx.lineWidth = 1;
  ctx.roundRect(16, 16, 320, 110, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#22d3ee';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`CINEMORPH ML FRAMING ENGINE v2.0`, 28, 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = '10px monospace';
  ctx.fillText(`FPS: ${data.fps.toFixed(1)} | LATENCY: ${data.inferenceTimeMs.toFixed(1)}ms`, 28, 54);
  ctx.fillText(`ACTIVE RULE: ${data.activeRule}`, 28, 70);
  ctx.fillText(`CONFIDENCE: ${(data.confidence * 100).toFixed(1)}%`, 28, 86);
  ctx.fillText(`PAN OFFSET: X=${data.panOffset.x.toFixed(3)}, Y=${data.panOffset.y.toFixed(3)}`, 28, 102);
}
```

---

## 4. 10-Second Ticket Printing Animation & Pre-Processing Synchronization

```
+--------------------------------------------------------------------------------------+
| 10-Second Ticket Printing & Pre-Processing Timeline                                  |
|                                                                                      |
| 0s              2s                   5s                   8s            9s       10s |
| +---------------+--------------------+--------------------+--------------+--------+  |
| | Shutter Opens | Mechanical Needle  | Thermal Print Pass | Perforation  | Tear & |  |
| | & Sound SFX   | Extrudes Ticket    | Ink Burn-in Effect | Glows Ready  | Open   |  |
| +---------------+--------------------+--------------------+--------------+--------+  |
|                                                                                      |
| Background Pre-Processing (Heads-Up Processing):                                     |
| [1. Video Init] -> [2. Buffer 300 Frames] -> [3. Pre-Compute ML Framing] -> [4. DSP] |
+--------------------------------------------------------------------------------------+
```

### 4.1 Visual & Audio Design Specifications

- **Aesthetic**: Vintage paper texture (`#f4ecd8`), deckle edges, perforated tear line, retro typography (`Courier New` / `Monospace`), thermal barcode, authentic theater seal stamp.
- **Sound Design (Web Audio API Synthesizer)**:
  - $0.0\text{s}$: Low mechanical solenoid thump ($f = 80\text{ Hz} \to 30\text{ Hz}$, $t = 80\text{ ms}$).
  - $2.0 - 8.0\text{s}$: Thermal print head rasterization chatter (rapid white-noise bursts passed through bandpass filter at $3.2\text{ kHz}$).
  - $9.0\text{s}$: Crisp paper tear sound effect ($f = 4.5\text{ kHz}$ highpass burst with rapid decay).

### 4.2 Pre-Processing ("Heads Up Processing") Execution

While the user is engaged with the 10-second ticket printing sequence, the application executes background initialization:
1. **Video Decoder Initialization**:
   - `HTMLVideoElement` is instantiated in a detached DOM container or `VideoDecoder` WebCodecs stream is opened.
2. **First 300-Frame Pre-Scan**:
   - Analyzes the opening 10-15 seconds of video frames to pre-populate the scene cut cache and initial focal trajectory.
3. **Audio Convolver Calibration**:
   - Pre-allocates the 5-band parametric equalizer filter graph and builds the 3D HRTF spatial panner node.
4. **Three.js Shader Warm-Up**:
   - Triggers `renderer.compile(scene, camera)` to eliminate runtime shader compilation jank.

### 4.3 Ticket State & Persistence Schema

```typescript
export interface MovieTicket {
  id: string;                      // e.g. "ticket-1724428900-a7b2"
  mediaId: string;                 // Local file hash or YouTube video ID
  title: string;                   // Movie / Video title
  durationSeconds: number;
  lastProgressSeconds: number;     // Resumption timestamp
  completionRatio: number;         // 0.0 to 1.0
  seatAssignment: string;          // e.g. "VIP BALCONY - ROW D - SEAT 07"
  ticketIssuedAt: number;          // Epoch timestamp
  dominantThemeColor: string;      // RGB hex extracted from video poster
  aspectRatioPreference: string;   // '1.43:1' | '1.90:1' | 'original'
  isTornStub: boolean;             // True if already watched/in-progress
}
```

- Stored in `localStorage` under key `omnistream_cinemorph_tickets` and synchronized with `IndexedDB` for media blob metadata.
- Clicking any torn stub in the ticket reel instantly restores player state and seeks to `lastProgressSeconds`.

---

## 5. E2E Testing Framework Strategy

```
+-------------------------------------------------------------------------------+
|                       E2E Testing Architecture (Playwright)                   |
+---------------------------------------+---------------------------------------+
                                        |
        +-------------------------------+-------------------------------+
        |                               |                               |
+-------v-------+               +-------v-------+               +-------v-------+
|  U-TUBE Tests |               | CineMorph 3D  |               | ML & Framing  |
|  - Search (3) |               | - Canvas Size |               | - Bbox Drift  |
|  - Storage    |               | - WebGL Init  |               | - Hysteresis  |
|  - Ad-Free UI |               | - Offline Fall|               | - HUD Output  |
+---------------+               +---------------+               +---------------+
```

### 5.1 Test Suites & Validation Matrix

| Test Suite | Target Invariant | Verification Method |
|---|---|---|
| **U-TUBE Search & Persistence** | Exactly 3 search results displayed; Subscriptions persist across page reload | Intercept YouTube API requests with mock fixtures; Assert DOM card count $== 3$; Read `localStorage` after reload |
| **CineMorph 3D Scene Initialization** | Three.js WebGL canvas scales to viewport; InstancedMesh seat count $== 120$ | Query `<canvas>` element bounding box; inspect Three.js scene object hierarchy via exposed `window.__OMNISTREAM_TEST_HOOKS__` |
| **Aspect Ratio & Offline Fallback** | Aspect toggle transforms UV scale; Offline network forces 4:3 cropped safe mode | Simulate `page.setOfflineMode(true)`; Assert screen material aspect updates to `4/3` and ML loop pauses gracefully |
| **Framing ML Mathematical Invariants** | Panning $(X, Y)$ smooth pursuit adheres to deadzone; no NaN/out-of-bounds offsets | Feed synthetic animated canvas feed (`captureStream()`) to video player; assert diagnostic overlay coords remain within $[-0.45, 0.45]$ |
| **Ticket Animation & Resume State** | 10-second ticket printer runs prior to video playback; Click torn ticket resumes timestamp | Mock video duration; verify ticket countdown reaches $0$ before `video.play()` is invoked; assert `currentTime == savedProgress` |

### 5.2 Synthetic Video Feed & WebGL Mocking Harness

```typescript
// tests/e2e/cinemorph.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CineMorph 3D Theater & ML Framing E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Inject synthetic canvas video stream to simulate local MP4
    await page.addInitScript(() => {
      window.__OMNISTREAM_TEST_MODE__ = true;
    });
  });

  test('Search returns exactly 3 results and persists history', async ({ page }) => {
    await page.goto('/search?q=interstellar');
    const cards = page.locator('[data-testid="video-card"]');
    await expect(cards).toHaveCount(3);

    const history = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('omnistream_history') || '[]');
    });
    expect(history.length).toBeGreaterThan(0);
  });

  test('10-second ticket printing animation executes before theater playback', async ({ page }) => {
    await page.goto('/theater/local-test-movie');
    const ticketPrinter = page.locator('[data-testid="ticket-printer"]');
    await expect(ticketPrinter).toBeVisible();

    // Verify countdown and thermal print progression
    await page.waitForTimeout(10000);
    await expect(ticketPrinter).toBeHidden();

    const theaterCanvas = page.locator('canvas[data-testid="cinemorph-three-canvas"]');
    await expect(theaterCanvas).toBeVisible();
  });

  test('ML Framing Diagnostic Overlay outputs valid pan coordinates', async ({ page }) => {
    await page.goto('/theater/local-test-movie');
    await page.keyboard.press('KeyD'); // Toggle Diagnostic HUD

    const hud = page.locator('[data-testid="diagnostic-hud"]');
    await expect(hud).toBeVisible();

    const telemetry = await page.evaluate(() => {
      return (window as any).__OMNISTREAM_TEST_HOOKS__?.getFramingTelemetry();
    });

    expect(telemetry.confidence).toBeGreaterThan(0.5);
    expect(telemetry.panOffset.x).toBeGreaterThanOrEqual(-0.5);
    expect(telemetry.panOffset.x).toBeLessThanOrEqual(0.5);
  });
});
```

---

## 6. Synthesis & Implementation Roadmap

```
                                  MILESTONE TIMELINE
+-----------------------------------------------------------------------------------+
| M1: Three.js 3D Theater Engine (Curved Screen, Instanced Seats, Lighting)         |
|                                                                                   |
| M2: Client-Side ML Framing Pipeline (Web Worker, BlazeFace/Saliency, Hysteresis)  |
|                                                                                   |
| M3: Diagnostic Overlay & Ticket Printer State Machine                             |
|                                                                                   |
| M4: End-to-End Test Suite & Offline Fallback Validation                           |
+-----------------------------------------------------------------------------------+
```

### Key Technical Decisions
1. **Three.js Instancing over Individual Meshes**: Reduces draw calls from $>150$ to $<12$, guaranteeing solid 60 FPS even on integrated GPUs.
2. **GPU UV Matrix Manipulation over Geometry Rebuilding**: Instantaneous aspect ratio switching and smooth pan-and-scan without garbage collection overhead or vertex buffer reallocation.
3. **Web Worker OffscreenCanvas for ML**: Offloads all computer vision / tensor computations from the React UI thread, preventing dropped frames during audio DSP and UI animations.
4. **Resilient Dual-Tier Framing**: BlazeFace / MediaPipe for high-fidelity facial composition with automatic fallback to $32 \times 18$ Sobel/Luminance saliency when offline or unaccelerated.
5. **Deterministic Ticket State Machine**: Connects the 10-second ticket printing animation directly with background video decoding and shader warm-up for seamless showtime transition.

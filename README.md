# SWARNA FARMS — Cinematic Scroll Experience

A mobile-first cinematic scroll experience for Swarna Farms, built with hardware-accelerated HTML5 Canvas, progressive frame buffering, and luxury editorial design.

## Features

- **Frame-by-Frame Scroll Scrubbing**: 240 high-efficiency WebP frames mapped directly to scroll progress with buttery LERP inertia damping.
- **Dual-Tier Progressive Buffering**: Instant low-res preview streaming coupled with a priority lookahead buffer for full-res master frames.
- **Off-Thread Decoding**: Decoded via `createImageBitmap` for 60/120fps stutter-free mobile scrubbing.
- **Mobile-First 9:16 Preservation**: Preserves the vertical film composition on all screen sizes (360px - 430px+).
- **Decoupled Architecture**: Clean ES modules separating physics, canvas rendering, buffer management, editorial typography, and ending states.

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Deploying to Render

This repository is pre-configured with `render.yaml` for 1-click deployment on Render:

1. Push this repository to GitHub:
   ```bash
   git push -u origin main
   ```
2. Log into [Render](https://dashboard.render.com/).
3. Click **New +** -> **Static Site** (or **Blueprint**).
4. Connect the repository `nsuryachandra/Swarna_Farms`.
5. If creating a **Static Site** manually:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
6. Click **Create Static Site**.

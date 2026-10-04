/**
 * GPU-Accelerated Canvas Renderer for 9:16 Cinematic Scrubbing
 * 
 * Features:
 * - High-DPI Retina compensation with safe memory caps
 * - Aspect ratio containment preserving the uncropped 9:16 composition
 * - Fast context setup with desynchronized mode and disabled alpha blending
 * - Avoids redundant redraws when frame index has not changed
 */

export class CanvasRenderer {
  constructor(canvasElement, config) {
    this.canvas = canvasElement;
    this.config = config;
    this.ctx = this.canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });

    this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.containerWidth = 0;
    this.containerHeight = 0;
    this.renderRect = { x: 0, y: 0, width: 0, height: 0 };
    this.lastDrawnAsset = null;

    this.resize = this.resize.bind(this);
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', this.resize, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(this.resize, 100);
    }, { passive: true });
  }

  resize() {
    const parent = this.canvas.parentElement || document.body;
    const rect = parent.getBoundingClientRect();
    
    this.containerWidth = rect.width;
    this.containerHeight = rect.height;

    // Retina-scaled buffer
    this.canvas.width = Math.round(this.containerWidth * this.dpr);
    this.canvas.height = Math.round(this.containerHeight * this.dpr);

    // CSS size
    this.canvas.style.width = `${this.containerWidth}px`;
    this.canvas.style.height = `${this.containerHeight}px`;

    // Compute 9:16 containment bounds
    const targetAspect = this.config.aspectRatio || (720 / 1280);
    const containerAspect = this.containerWidth / this.containerHeight;

    let drawW, drawH, drawX, drawY;

    if (containerAspect > targetAspect) {
      // Container is wider than 9:16 (desktop or wide view)
      drawH = this.containerHeight;
      drawW = drawH * targetAspect;
      drawX = (this.containerWidth - drawW) / 2;
      drawY = 0;
    } else {
      // Container is taller/narrower (mobile screen)
      // Fit to width or cover slightly if screen ratio is within 10%
      drawW = this.containerWidth;
      drawH = drawW / targetAspect;
      drawX = 0;
      drawY = (this.containerHeight - drawH) / 2;
    }

    this.renderRect = {
      x: Math.round(drawX * this.dpr),
      y: Math.round(drawY * this.dpr),
      width: Math.round(drawW * this.dpr),
      height: Math.round(drawH * this.dpr)
    };

    // Reset last drawn to force redraw on next tick
    this.lastDrawnAsset = null;
  }

  drawFrame(frameAsset) {
    if (!frameAsset || !this.ctx) return;
    if (this.lastDrawnAsset === frameAsset) return; // Prevent unnecessary GPU redraws

    const { x, y, width, height } = this.renderRect;

    // Fill backdrop in case of pillarboxing on desktop
    this.ctx.fillStyle = '#080907';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Render frame
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(frameAsset, x, y, width, height);

    this.lastDrawnAsset = frameAsset;
  }

  destroy() {
    window.removeEventListener('resize', this.resize);
    this.lastDrawnAsset = null;
  }
}

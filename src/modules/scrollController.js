/**
 * Smooth Physics-Based Scroll Controller
 * 
 * Features:
 * - Passive window scroll listener decoupled from rendering cycle
 * - LERP smoothing (Linear Interpolation) to cushion fast mobile swipe gestures
 * - requestAnimationFrame driver for 60fps/120fps hardware refresh
 * - Normalized progress calculation (0.0 to 1.0) and frame index mapping
 * - Automatic transition detection when passing the sticky boundary
 */

export class ScrollController {
  constructor(scrollContainerElement, config, callbacks = {}) {
    this.container = scrollContainerElement;
    this.config = config;
    this.callbacks = callbacks; // { onFrameUpdate, onProgressUpdate, onSectionTransition }

    this.rawProgress = 0;
    this.targetFrame = 1;
    this.currentFrame = 1;
    this.totalFrames = config.frameCount;
    this.damping = config.dampingFactor || 0.095;

    this.isRunning = false;
    this.isCompleted = false;
    this.rafId = null;

    this.onScroll = this.onScroll.bind(this);
    this.tick = this.tick.bind(this);

    this.init();
  }

  init() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.updateScrollBounds();
    window.addEventListener('resize', () => this.updateScrollBounds(), { passive: true });
    this.start();
  }

  updateScrollBounds() {
    this.onScroll();
  }

  onScroll() {
    if (!this.container) return;

    const rect = this.container.getBoundingClientRect();
    const windowH = window.innerHeight;
    const maxScroll = rect.height - windowH;

    if (maxScroll <= 0) {
      this.rawProgress = 0;
      this.targetFrame = 1;
      return;
    }

    // Amount scrolled into the container
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / maxScroll));
    this.rawProgress = progress;

    // Map 0.0 - 1.0 to frame indices 1 - totalFrames
    this.targetFrame = 1 + progress * (this.totalFrames - 1);

    // Check if user has completely scrolled past the cinematic section
    const pastSection = scrolled >= maxScroll;
    if (pastSection !== this.isCompleted) {
      this.isCompleted = pastSection;
      if (this.callbacks.onSectionTransition) {
        this.callbacks.onSectionTransition(pastSection);
      }
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tick();
  }

  tick() {
    if (!this.isRunning) return;

    // Smooth inertia interpolation (LERP)
    const diff = this.targetFrame - this.currentFrame;
    if (Math.abs(diff) > 0.002) {
      this.currentFrame += diff * this.damping;
    } else {
      this.currentFrame = this.targetFrame;
    }

    const smoothedProgress = (this.currentFrame - 1) / (this.totalFrames - 1);
    const roundedIndex = Math.max(1, Math.min(this.totalFrames, Math.round(this.currentFrame)));

    // Fire frame update callback
    if (this.callbacks.onFrameUpdate) {
      this.callbacks.onFrameUpdate(this.currentFrame, roundedIndex);
    }

    // Fire progress update callback
    if (this.callbacks.onProgressUpdate) {
      this.callbacks.onProgressUpdate(smoothedProgress, this.rawProgress);
    }

    this.rafId = requestAnimationFrame(this.tick);
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  destroy() {
    this.stop();
    window.removeEventListener('scroll', this.onScroll);
  }
}

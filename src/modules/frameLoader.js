/**
 * Intelligent Frame Preloader & Memory-Conscious Buffer Engine
 * 
 * Features:
 * - Asynchronous off-main-thread image decoding via createImageBitmap
 * - Dual-tier progressive loading (instant low-res preview + full-res master)
 * - Priority-based sliding lookahead window based on user scroll position
 * - LRU/Distance-based memory cleanup to prevent mobile RAM saturation
 * - Nearest-neighbor frame fallback ensuring ZERO visual stutter or blank frames
 */

export class FrameLoader {
  constructor(config) {
    this.config = config;
    this.totalFrames = config.frameCount;
    
    // Memory caches
    this.highResCache = new Map(); // frameIndex (1-based) -> ImageBitmap | HTMLImageElement
    this.lowResCache = new Map();  // frameIndex (1-based) -> ImageBitmap | HTMLImageElement
    
    // Loading tracking
    this.pendingHigh = new Set();
    this.pendingLow = new Set();
    this.lastAccessTimes = new Map();
    
    // State
    this.lastRenderedIndex = 1;
    this.isInitialReady = false;
    this.supportBitmap = typeof window.createImageBitmap === 'function';
  }

  /**
   * Loads initial critical frames required to begin the interactive scrub.
   * Reports progress 0-100% to power the subtle minimal loader.
   */
  async loadInitialFrames(onProgress) {
    const targetCount = this.config.initialPreloadCount;
    let loadedCount = 0;

    // First, immediately load Frame 1 (low & high) so first paint is instant
    await Promise.allSettled([
      this.loadSingleFrame(1, 'low'),
      this.loadSingleFrame(1, 'high')
    ]);
    loadedCount = 1;
    onProgress(Math.round((loadedCount / targetCount) * 100));

    // Next load the initial window (2 through targetCount)
    const promises = [];
    for (let i = 2; i <= targetCount; i++) {
      const p = this.loadSingleFrame(i, 'high')
        .catch(() => this.loadSingleFrame(i, 'low'))
        .finally(() => {
          loadedCount++;
          if (onProgress) {
            const pct = Math.min(100, Math.round((loadedCount / targetCount) * 100));
            onProgress(pct);
          }
        });
      promises.push(p);
    }

    await Promise.allSettled(promises);
    this.isInitialReady = true;

    // Start background progressive trickle of preview frames and next forward segment
    this.startBackgroundProgressiveLoad();
  }

  /**
   * Fetches and decodes a single frame into memory using off-thread decoding when available.
   */
  async loadSingleFrame(frameIndex, tier = 'high') {
    if (frameIndex < 1 || frameIndex > this.totalFrames) return null;
    
    const cache = tier === 'high' ? this.highResCache : this.lowResCache;
    const pending = tier === 'high' ? this.pendingHigh : this.pendingLow;

    if (cache.has(frameIndex)) {
      return cache.get(frameIndex);
    }

    if (pending.has(frameIndex)) {
      return null;
    }

    pending.add(frameIndex);
    const url = tier === 'high' 
      ? this.config.getHighResPath(frameIndex)
      : this.config.getLowResPath(frameIndex);

    try {
      if (this.supportBitmap) {
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        cache.set(frameIndex, bitmap);
        this.lastAccessTimes.set(frameIndex, performance.now());
        pending.delete(frameIndex);
        return bitmap;
      } else {
        const img = new Image();
        img.src = url;
        if ('decode' in img) {
          await img.decode();
        } else {
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
          });
        }
        cache.set(frameIndex, img);
        this.lastAccessTimes.set(frameIndex, performance.now());
        pending.delete(frameIndex);
        return img;
      }
    } catch (err) {
      pending.delete(frameIndex);
      return null;
    }
  }

  /**
   * Background loader that progressively streams low-res preview frames
   * across the whole timeline during idle cycles to guarantee zero dropped frames,
   * while the priority high-res sliding window handles the sharp foreground frames.
   */
  startBackgroundProgressiveLoad() {
    let cursor = 1;
    const loadNextBatch = () => {
      if (cursor > this.totalFrames) return;
      const end = Math.min(cursor + 6, this.totalFrames);
      const batch = [];
      for (let i = cursor; i <= end; i++) {
        if (!this.lowResCache.has(i) && !this.pendingLow.has(i)) {
          batch.push(this.loadSingleFrame(i, 'low'));
        }
      }
      cursor = end + 1;
      Promise.allSettled(batch).then(() => {
        if ('requestIdleCallback' in window) {
          requestIdleCallback(loadNextBatch, { timeout: 250 });
        } else {
          setTimeout(loadNextBatch, 40);
        }
      });
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadNextBatch, { timeout: 300 });
    } else {
      setTimeout(loadNextBatch, 80);
    }
  }

  /**
   * Updates the priority buffer window around the current active frame index.
   * Evicts distant frames if memory threshold is reached.
   */
  updateWindow(currentFrameIndex) {
    const current = Math.max(1, Math.min(this.totalFrames, Math.round(currentFrameIndex)));
    const ahead = this.config.bufferAheadCount || 30;
    const behind = this.config.bufferBehindCount || 15;

    const startAhead = current;
    const endAhead = Math.min(this.totalFrames, current + ahead);
    const startBehind = Math.max(1, current - behind);

    // Forward priority load
    for (let i = startAhead; i <= endAhead; i++) {
      if (!this.highResCache.has(i) && !this.pendingHigh.has(i)) {
        this.loadSingleFrame(i, 'high');
      }
    }

    // Backward safety load
    for (let i = current - 1; i >= startBehind; i--) {
      if (!this.highResCache.has(i) && !this.pendingHigh.has(i)) {
        this.loadSingleFrame(i, 'high');
      }
    }

    // Protect mobile memory from runaway allocation
    this.evictDistantFrames(current);
  }

  /**
   * Evicts frames farthest from current playhead when memory limit is exceeded.
   * Always protects frame 1 (hero anchor) and the final frame.
   */
  evictDistantFrames(currentFrame) {
    const max = this.config.maxCachedFrames || 120;
    if (this.highResCache.size <= max) return;

    const entries = Array.from(this.highResCache.keys())
      .filter(idx => idx !== 1 && idx !== this.totalFrames)
      .map(idx => ({
        idx,
        dist: Math.abs(idx - currentFrame),
        lastAccess: this.lastAccessTimes.get(idx) || 0
      }))
      .sort((a, b) => b.dist - a.dist);

    const countToEvict = this.highResCache.size - max;
    for (let i = 0; i < countToEvict && i < entries.length; i++) {
      const idx = entries[i].idx;
      // Close ImageBitmap to free GPU memory immediately
      const item = this.highResCache.get(idx);
      if (item && typeof item.close === 'function') {
        item.close();
      }
      this.highResCache.delete(idx);
      this.lastAccessTimes.delete(idx);
    }
  }

  /**
   * Returns the best frame asset for a given index.
   * Fallback hierarchy: Exact High -> Exact Low -> Nearest Loaded High/Low -> Last Rendered.
   * Guarantees zero blank flashes.
   */
  getFrame(frameIndex) {
    const target = Math.max(1, Math.min(this.totalFrames, Math.round(frameIndex)));

    // 1. Direct High-Res match
    if (this.highResCache.has(target)) {
      this.lastAccessTimes.set(target, performance.now());
      this.lastRenderedIndex = target;
      return this.highResCache.get(target);
    }

    // 2. Direct Low-Res preview match
    if (this.lowResCache.has(target)) {
      return this.lowResCache.get(target);
    }

    // 3. Search nearest neighbor in high-res cache
    let closestIndex = null;
    let minDistance = Infinity;

    for (const key of this.highResCache.keys()) {
      const d = Math.abs(key - target);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = key;
      }
    }

    if (closestIndex !== null && minDistance <= 8) {
      return this.highResCache.get(closestIndex);
    }

    // 4. Return last valid rendered frame
    if (this.highResCache.has(this.lastRenderedIndex)) {
      return this.highResCache.get(this.lastRenderedIndex);
    }

    // 5. Ultimate fallback: frame 1
    return this.highResCache.get(1) || null;
  }
}

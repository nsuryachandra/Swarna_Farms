/**
 * SWARNA FARMS - Main Orchestrator
 * 
 * Bridges frame preloading, canvas rendering, high-precision scroll physics,
 * and editorial narrative typography.
 */

import { CONFIG } from './config.js';
import { FrameLoader } from './modules/frameLoader.js';
import { CanvasRenderer } from './modules/canvasRenderer.js';
import { ScrollController } from './modules/scrollController.js';
import { TextOverlays } from './modules/textOverlays.js';
import { LoadingScreen } from './modules/loadingScreen.js';
import { EndingSection } from './modules/endingSection.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Select DOM Elements
  const loaderEl = document.getElementById('minimal-loader');
  const scrollTrackEl = document.getElementById('scroll-track');
  const canvasEl = document.getElementById('frame-canvas');
  const editorialOverlayEl = document.getElementById('editorial-overlay');
  const scrollPromptEl = document.getElementById('scroll-prompt');
  const endingSectionEl = document.getElementById('ending-section');

  // 2. Initialize Subsystems
  const loadingScreen = new LoadingScreen(loaderEl);
  const frameLoader = new FrameLoader(CONFIG);
  const canvasRenderer = new CanvasRenderer(canvasEl, CONFIG);
  const textOverlays = new TextOverlays(editorialOverlayEl, CONFIG);
  new EndingSection(endingSectionEl);

  let hasScrolledPastStart = false;

  // 3. Initialize Scroll Controller with Decoupled Callbacks
  const scrollController = new ScrollController(scrollTrackEl, CONFIG, {
    onFrameUpdate: (frameFloat, frameInt) => {
      // Retrieve decoded image/bitmap from the intelligent memory buffer
      const frameAsset = frameLoader.getFrame(frameInt);
      if (frameAsset) {
        canvasRenderer.drawFrame(frameAsset);
      }

      // Keep lookahead sliding window warm in background
      frameLoader.updateWindow(frameInt);
    },

    onProgressUpdate: (smoothedProgress, rawProgress) => {
      // Update narrative editorial typography
      textOverlays.update(smoothedProgress);

      // Hide the initial scroll indicator once user has engaged
      if (rawProgress > 0.015 && !hasScrolledPastStart) {
        hasScrolledPastStart = true;
        if (scrollPromptEl) {
          scrollPromptEl.classList.remove('is-visible');
        }
      } else if (rawProgress <= 0.005 && hasScrolledPastStart) {
        hasScrolledPastStart = false;
        if (scrollPromptEl) {
          scrollPromptEl.classList.add('is-visible');
        }
      }
    },

    onSectionTransition: (isPast) => {
      // Pinned sticky viewport naturally transitions to ending section
    }
  });

  // 4. Begin Initial Preload Sequence
  try {
    await frameLoader.loadInitialFrames((percent) => {
      loadingScreen.updateProgress(percent);
    });

    // Render frame 1 immediately
    const frameOne = frameLoader.getFrame(1);
    if (frameOne) {
      canvasRenderer.drawFrame(frameOne);
    }

    // Dismiss loader smoothly
    loadingScreen.complete();

    // Trigger initial positioning
    scrollController.onScroll();
  } catch (error) {
    console.error('Error during initial asset preloading:', error);
    loadingScreen.complete();
  }
});

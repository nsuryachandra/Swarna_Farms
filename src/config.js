/**
 * SWARNA FARMS - Cinematic Scroll Experience Configuration
 * Cleanly decoupled parameters for assets, timing, physics, and editorial story beats.
 */

export const CONFIG = {
  // Video Frame Geometry & Timeline
  frameCount: 240,
  aspectRatio: 720 / 1280, // 9:16 vertical ratio
  sourceWidth: 720,
  sourceHeight: 1280,

  // Scroll Timeline
  // 550vh provides ~5.5 screen heights of smooth tactile scrubbing on mobile
  scrollDurationVh: 550,

  // Physics & Interpolation
  // Damping factor for smooth frame scrubbing (0.08 - 0.12 gives luxury inertia)
  dampingFactor: 0.095,

  // Intelligent Preloading
  initialPreloadCount: 20, // Frames loaded before loader unlocks
  bufferAheadCount: 30,    // Sliding window frames ahead of current playhead
  bufferBehindCount: 15,   // Sliding window frames kept behind current playhead
  maxCachedFrames: 120,    // Memory boundary protection for mobile devices

  // Asset Resolvers
  getHighResPath: (index) => {
    const padded = String(index).padStart(4, '0');
    return `/frames/frame_${padded}.webp`;
  },
  getLowResPath: (index) => {
    const padded = String(index).padStart(4, '0');
    return `/frames_low/frame_${padded}.webp`;
  },

  // Editorial Narrative Beats (mapped to normalized scroll progress 0.0 - 1.0)
  editorialCues: [
    {
      id: 'chapter-1',
      start: 0.05,
      peak: 0.14,
      end: 0.23,
      eyebrow: '01 / ORIGIN',
      headline: 'From Sacred Soil',
      description: 'A single heirloom seed chosen with generational reverence.'
    },
    {
      id: 'chapter-2',
      start: 0.27,
      peak: 0.36,
      end: 0.45,
      eyebrow: '02 / AWAKENING',
      headline: 'Dew & Pure Springs',
      description: 'Sprouting in fertile earth, nourished by unhurried mineral waters.'
    },
    {
      id: 'chapter-3',
      start: 0.49,
      peak: 0.58,
      end: 0.67,
      eyebrow: '03 / VITALITY',
      headline: 'Bathed in Sunlight',
      description: 'Lush green stalks breathing life under untamed rural skies.'
    },
    {
      id: 'chapter-4',
      start: 0.71,
      peak: 0.80,
      end: 0.88,
      eyebrow: '04 / HARVEST',
      headline: 'Patience Turned to Gold',
      description: 'Bowing heavily with abundance at the sacred moment of harvest.'
    },
    {
      id: 'chapter-5',
      start: 0.91,
      peak: 0.95,
      end: 0.99,
      eyebrow: '05 / ESSENCE',
      headline: 'Pure Grain. Pure Truth.',
      description: 'Milled to perfection. Pristine, uncompromised nourishment.'
    }
  ]
};

/**
 * Minimal Editorial Text Overlay Controller
 * 
 * Coordinates high-end, discreet typography overlays mapped to cinematic scroll progress.
 * Adheres strictly to the luxury editorial aesthetic:
 * - No cards, no heavy containers
 * - Feathered fade-in/fade-out transitions driven directly by progress
 * - Placed carefully to preserve focal visual storytelling
 */

export class TextOverlays {
  constructor(containerElement, config) {
    this.container = containerElement;
    this.config = config;
    this.cueElements = new Map();

    this.init();
  }

  init() {
    this.container.innerHTML = '';
    
    // Build DOM elements for each configured editorial cue
    this.config.editorialCues.forEach((cue) => {
      const el = document.createElement('div');
      el.className = 'editorial-cue';
      el.id = cue.id;
      
      el.innerHTML = `
        <div class="cue-eyebrow">${cue.eyebrow}</div>
        <h2 class="cue-headline">${cue.headline}</h2>
        <p class="cue-description">${cue.description}</p>
      `;

      this.container.appendChild(el);
      this.cueElements.set(cue.id, {
        el,
        cue
      });
    });
  }

  /**
   * Updates opacity and subtle vertical travel for each cue based on normalized progress
   */
  update(progress) {
    this.cueElements.forEach(({ el, cue }) => {
      const { start, peak, end } = cue;

      if (progress < start || progress > end) {
        if (el.style.opacity !== '0') {
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.visibility = 'hidden';
        }
        return;
      }

      el.style.visibility = 'visible';
      let opacity = 0;
      let translateY = 0;

      if (progress < peak) {
        // Entering: fade in and rise gently (6px -> 0px)
        const t = (progress - start) / (peak - start);
        opacity = t;
        translateY = (1 - t) * 6;
      } else {
        // Exiting: fade out and rise gently (0px -> -6px)
        const t = (progress - peak) / (end - peak);
        opacity = 1 - t;
        translateY = -t * 6;
      }

      // Smooth clamping
      opacity = Math.max(0, Math.min(1, opacity));
      el.style.opacity = opacity.toFixed(3);
      el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
    });
  }
}

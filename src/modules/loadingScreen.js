/**
 * Minimalist Editorial Loading Screen
 * 
 * Elegant, non-distracting 0-100% progress indicator with bespoke typography.
 * Smoothly dissolves to reveal the interactive hero film once initial buffer is ready.
 */

export class LoadingScreen {
  constructor(element) {
    this.element = element;
    this.progressText = element.querySelector('.loader-percent');
    this.progressBar = element.querySelector('.loader-bar-fill');
    this.promptEl = document.querySelector('.scroll-prompt');
    this.currentPercent = 0;
  }

  updateProgress(percent) {
    this.currentPercent = Math.min(100, Math.max(0, percent));
    if (this.progressText) {
      this.progressText.textContent = `${this.currentPercent}%`;
    }
    if (this.progressBar) {
      this.progressBar.style.width = `${this.currentPercent}%`;
    }
  }

  complete() {
    this.updateProgress(100);
    setTimeout(() => {
      this.element.classList.add('is-hidden');
      if (this.promptEl) {
        this.promptEl.classList.add('is-visible');
      }
      setTimeout(() => {
        this.element.style.display = 'none';
      }, 900);
    }, 200);
  }
}

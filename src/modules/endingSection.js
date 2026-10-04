/**
 * Ending Brand Section Controller
 * 
 * Handles interaction logic for the final brand reveal:
 * - Seamless replay button restoring scroll to top
 * - Minimalist notification form feedback
 */

export class EndingSection {
  constructor(element) {
    this.element = element;
    this.form = element.querySelector('#notify-form');
    this.input = element.querySelector('#notify-email');
    this.message = element.querySelector('#notify-message');
    this.replayBtn = element.querySelector('#replay-btn');

    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = this.input.value.trim();
        if (!email || !email.includes('@')) {
          this.showMessage('Please enter a valid email address.');
          return;
        }

        this.showMessage('Thank you. You will be quietly notified.');
        this.input.value = '';
      });
    }

    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }
  }

  showMessage(msg) {
    if (!this.message) return;
    this.message.textContent = msg;
    this.message.classList.add('is-active');
    setTimeout(() => {
      this.message.classList.remove('is-active');
    }, 4500);
  }
}

// js/timer.js
// Self-contained countdown timer

export class ExamTimer {
  /**
   * @param {number} totalSeconds - countdown duration
   * @param {HTMLElement} displayEl - element to update
   * @param {Function} onExpire - called when timer reaches 0
   */
  constructor(totalSeconds, displayEl, onExpire) {
    this._seconds   = totalSeconds;
    this._el        = displayEl;
    this._onExpire  = onExpire;
    this._interval  = null;
    this._paused    = false;
    this._render();
  }

  start() {
    if (this._interval) return;
    this._interval = setInterval(() => {
      if (this._paused) return;
      this._seconds--;
      this._render();
      if (this._seconds <= 0) {
        this.stop();
        this._onExpire();
      }
    }, 1000);
  }

  stop() {
    clearInterval(this._interval);
    this._interval = null;
  }

  pause() { this._paused = true; }
  resume() { this._paused = false; }

  get remaining() { return this._seconds; }

  _render() {
    const m = Math.floor(this._seconds / 60);
    const s = this._seconds % 60;
    this._el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    this._el.className = '';
    if (this._seconds < 300)      this._el.classList.add('danger');
    else if (this._seconds < 900) this._el.classList.add('warning');
  }
}

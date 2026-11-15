/**
 * Audio Synthesizer Engine using pure Web Audio API.
 * Provides crisp detective sound effects without any external mp3/wav files.
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.5;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val) {
    this.enabled = Boolean(val);
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const effectiveGain = gainVal * this.volume;
      gain.gain.setValueAtTime(effectiveGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playTone error:', e);
    }
  }

  playClick() {
    this.playTone(850, 'triangle', 0.04, 0.08);
  }

  playTerminal() {
    this.playTone(1200 + Math.random() * 400, 'square', 0.03, 0.04);
  }

  playStep() {
    this.playTone(180 + Math.random() * 40, 'triangle', 0.06, 0.06);
  }

  playUnlock() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.18, 0.12);
      }, idx * 70);
    });
  }

  playClue() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.22, 0.15);
      }, idx * 90);
    });
  }

  playSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.25, 0.2);
      }, idx * 80);
    });
  }

  playError() {
    this.playTone(160, 'sawtooth', 0.2, 0.15);
  }
}

export const soundManager = new SoundManager();


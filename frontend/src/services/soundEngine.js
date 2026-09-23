// PLAYFORGE Web Audio API Synthesizer (Zero-Latency Procedural Audio)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('playforge_muted') === 'true';
    this.isInitialized = false;
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.isInitialized = true;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('playforge_muted', String(this.isMuted));
    return this.isMuted;
  }

  play(type) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      switch (type) {
        case 'paddle_hit': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(440, t);
          osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.08);
          break;
        }

        case 'wall_hit': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, t);
          osc.frequency.exponentialRampToValueAtTime(110, t + 0.06);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.06);
          break;
        }

        case 'score': {
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t + i * 0.07);
            gain.gain.setValueAtTime(0.25, t + i * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.07 + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.07);
            osc.stop(t + i * 0.07 + 0.15);
          });
          break;
        }

        case 'powerup': {
          [330, 440, 554, 659, 880].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, t + i * 0.04);
            gain.gain.setValueAtTime(0.15, t + i * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.04 + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t + i * 0.04);
            osc.stop(t + i * 0.04 + 0.08);
          });
          break;
        }

        case 'laser': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(900, t);
          osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.12);
          break;
        }

        case 'explosion':
        case 'alien_kill': {
          const node = this.ctx.createBufferSource();
          const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.25), this.ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < buffer.length; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          node.buffer = buffer;

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, t);
          filter.frequency.exponentialRampToValueAtTime(80, t + 0.25);

          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.4, t);
          gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

          node.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);
          node.start(t);
          break;
        }

        case 'click': {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, t);
          gain.gain.setValueAtTime(0.1, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.03);
          break;
        }

        default:
          break;
      }
    } catch {
      // Audio context catch
    }
  }
}

export const soundEngine = new SoundEngine();

// Auto-unlock audio on first click
if (typeof window !== 'undefined') {
  window.addEventListener('click', () => {
    soundEngine.init();
  }, { once: true });
}

export class SoundManager {
    ctx: AudioContext | null = null;

    constructor() {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
        } catch (e) {
            console.error("Web Audio API not supported", e);
        }
    }

    playShoot() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.1);
            
            // Clean up
            setTimeout(() => {
                osc.disconnect();
                gain.disconnect();
            }, 150);
        } catch (e) {
            console.warn("Audio playback failed:", e);
        }
    }

    playExplosion() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1, this.ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.3);
            
            // Clean up
            setTimeout(() => {
                osc.disconnect();
                gain.disconnect();
            }, 350);
        } catch (e) {
            console.warn("Audio playback failed:", e);
        }
    }

    resume() {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

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
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playExplosion() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    resume() {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

export class SoundManager {
    ctx: AudioContext | null = null;
    private lastShootTime: number = 0;
    private lastExplosionTime: number = 0;
    private readonly MIN_SHOOT_INTERVAL = 50; // ms
    private readonly MIN_EXPLOSION_INTERVAL = 100; // ms

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
        
        // Rate limiting
        const now = Date.now();
        if (now - this.lastShootTime < this.MIN_SHOOT_INTERVAL) return;
        this.lastShootTime = now;
        
        try {
            // Resume if suspended
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'square';
            osc.frequency.setValueAtTime(880, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.05, this.ctx.currentTime); // Reduced volume
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.1);
            
            // Clean up
            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {
                    // Already disconnected
                }
            };
        } catch (e) {
            // Silently fail - audio is not critical
        }
    }

    playExplosion() {
        if (!this.ctx) return;
        
        // Rate limiting
        const now = Date.now();
        if (now - this.lastExplosionTime < this.MIN_EXPLOSION_INTERVAL) return;
        this.lastExplosionTime = now;
        
        try {
            // Resume if suspended
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1, this.ctx.currentTime + 0.3);

            gain.gain.setValueAtTime(0.1, this.ctx.currentTime); // Reduced volume
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.3);
            
            // Clean up
            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {
                    // Already disconnected
                }
            };
        } catch (e) {
            // Silently fail - audio is not critical
        }
    }

    playWaveComplete() {
        if (!this.ctx) return;
        
        const now = Date.now();
        if (now - this.lastExplosionTime < this.MIN_EXPLOSION_INTERVAL) return;
        this.lastExplosionTime = now;
        
        try {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            // Triumphant ascending tone
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
            osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.3); // A5

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

            osc.start(this.ctx.currentTime);
            osc.stop(this.ctx.currentTime + 0.4);
            
            osc.onended = () => {
                try {
                    osc.disconnect();
                    gain.disconnect();
                } catch (e) {
                    // Already disconnected
                }
            };
        } catch (e) {
            // Silently fail
        }
    }

    resume() {
        if (this.ctx?.state === 'suspended') {
            this.ctx.resume().catch(() => {
                // Ignore resume errors
            });
        }
    }
}

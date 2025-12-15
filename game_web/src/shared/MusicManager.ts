// Music Manager for Space Odyssey
// Generates procedural background music using Web Audio API

export class MusicManager {
    private ctx: AudioContext | null = null;
    private currentTrack: 'menu' | 'sector1' | 'sector2' | 'sector3' | 'sector4' | 'sector5' | 'boss' | null = null;
    private oscillators: OscillatorNode[] = [];
    private gainNodes: GainNode[] = [];
    private masterGain: GainNode | null = null;
    private isPlaying: boolean = false;

    constructor() {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            
            if (this.ctx) {
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.3; // Master volume
                this.masterGain.connect(this.ctx.destination);
            }
        } catch (e) {
            console.error("Music system not available", e);
        }
    }

    private stopCurrent() {
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
                osc.disconnect();
            } catch (e) {
                // Already stopped
            }
        });
        this.gainNodes.forEach(gain => {
            try {
                gain.disconnect();
            } catch (e) {
                // Already disconnected
            }
        });
        this.oscillators = [];
        this.gainNodes = [];
        this.isPlaying = false;
    }

    play(track: 'menu' | 'sector1' | 'sector2' | 'sector3' | 'sector4' | 'sector5' | 'boss') {
        if (!this.ctx || !this.masterGain) return;
        
        // Don't restart if already playing same track
        if (this.currentTrack === track && this.isPlaying) return;
        
        this.stopCurrent();
        this.currentTrack = track;
        this.isPlaying = true;

        // Resume context if suspended
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        try {
            switch (track) {
                case 'menu':
                    this.playMenuMusic();
                    break;
                case 'sector1':
                    this.playSectorMusic(1);
                    break;
                case 'sector2':
                    this.playSectorMusic(2);
                    break;
                case 'sector3':
                    this.playSectorMusic(3);
                    break;
                case 'sector4':
                    this.playSectorMusic(4);
                    break;
                case 'sector5':
                    this.playSectorMusic(5);
                    break;
                case 'boss':
                    this.playBossMusic();
                    break;
            }
        } catch (e) {
            console.warn("Music playback failed:", e);
        }
    }

    private playMenuMusic() {
        if (!this.ctx || !this.masterGain) return;

        // Ambient pad sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, this.ctx.currentTime); // A2
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 1);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        
        this.oscillators.push(osc);
        this.gainNodes.push(gain);
    }

    private playSectorMusic(sector: number) {
        if (!this.ctx || !this.masterGain) return;

        // Base frequency increases with sector (more intense)
        const baseFreq = 110 + (sector - 1) * 22; // A2, B2, C#3, D#3, F3
        
        // Bass line (looping)
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(baseFreq / 2, this.ctx.currentTime);
        bassGain.gain.value = 0.15;
        bass.connect(bassGain);
        bassGain.connect(this.masterGain);
        bass.start();
        this.oscillators.push(bass);
        this.gainNodes.push(bassGain);

        // Pad (ambient)
        const pad = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        pad.type = 'sine';
        pad.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        padGain.gain.value = 0.08;
        pad.connect(padGain);
        padGain.connect(this.masterGain);
        pad.start();
        this.oscillators.push(pad);
        this.gainNodes.push(padGain);

        // Lead (higher pitch, varies by sector)
        const lead = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        lead.type = 'square';
        lead.frequency.setValueAtTime(baseFreq * 2, this.ctx.currentTime);
        leadGain.gain.value = 0.05;
        lead.connect(leadGain);
        leadGain.connect(this.masterGain);
        lead.start();
        this.oscillators.push(lead);
        this.gainNodes.push(leadGain);
    }

    private playBossMusic() {
        if (!this.ctx || !this.masterGain) return;

        // Intense, fast-paced boss music
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2
        bassGain.gain.value = 0.2;
        bass.connect(bassGain);
        bassGain.connect(this.masterGain);
        bass.start();
        this.oscillators.push(bass);
        this.gainNodes.push(bassGain);

        // Aggressive lead
        const lead = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        lead.type = 'square';
        lead.frequency.setValueAtTime(196, this.ctx.currentTime); // G3
        leadGain.gain.value = 0.1;
        lead.connect(leadGain);
        leadGain.connect(this.masterGain);
        lead.start();
        this.oscillators.push(lead);
        this.gainNodes.push(leadGain);

        // Pulsing effect
        const pulse = this.ctx.createOscillator();
        const pulseGain = this.ctx.createGain();
        pulse.type = 'triangle';
        pulse.frequency.setValueAtTime(4, this.ctx.currentTime); // 4 Hz pulse
        pulseGain.gain.value = 0.15;
        pulse.connect(pulseGain);
        pulseGain.connect(this.masterGain);
        pulse.start();
        this.oscillators.push(pulse);
        this.gainNodes.push(pulseGain);
    }

    stop() {
        this.stopCurrent();
        this.currentTrack = null;
    }

    setVolume(volume: number) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }
}

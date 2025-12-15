// Music Manager for Space Odyssey
// Generates retro 90s-style music using Web Audio API

export class MusicManager {
    private ctx: AudioContext | null = null;
    private currentTrack: 'menu' | 'sector1' | 'sector2' | 'sector3' | 'sector4' | 'sector5' | 'boss' | null = null;
    private oscillators: OscillatorNode[] = [];
    private gainNodes: GainNode[] = [];
    private masterGain: GainNode | null = null;
    private isPlaying: boolean = false;
    private intervalId: number | null = null;

    constructor() {
        try {
            // @ts-ignore
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            
            if (this.ctx) {
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.2; // Master volume
                this.masterGain.connect(this.ctx.destination);
            }
        } catch (e) {
            console.error("Music system not available", e);
        }
    }

    private stopCurrent() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
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
        
        if (this.currentTrack === track && this.isPlaying) return;
        
        this.stopCurrent();
        this.currentTrack = track;
        this.isPlaying = true;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        try {
            switch (track) {
                case 'sector1':
                case 'sector2':
                case 'sector3':
                case 'sector4':
                case 'sector5':
                    const sectorNum = parseInt(track.replace('sector', ''));
                    this.playRetroMelody(sectorNum);
                    break;
                case 'boss':
                    this.playBossMelody();
                    break;
            }
        } catch (e) {
            console.warn("Music playback failed:", e);
        }
    }

    private playNote(freq: number, duration: number, type: OscillatorType = 'square') {
        if (!this.ctx || !this.masterGain) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    private playRetroMelody(sector: number) {
        if (!this.ctx || !this.masterGain) return;

        // Retro 90s melodies - different per sector
        const melodies = {
            1: [262, 294, 330, 349, 392], // C Major
            2: [294, 330, 370, 392, 440], // D Minor pentatonic
            3: [330, 370, 392, 440, 494], // E Minor pentatonic
            4: [349, 392, 440, 494, 523], // F Major
            5: [392, 440, 494, 523, 587]  // G Major
        };

        const melody = melodies[sector as keyof typeof melodies] || melodies[1];
        let noteIndex = 0;

        // Bass line (continuous)
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(melody[0] / 2, this.ctx.currentTime);
        bassGain.gain.value = 0.1;
        bass.connect(bassGain);
        bassGain.connect(this.masterGain);
        bass.start();
        this.oscillators.push(bass);
        this.gainNodes.push(bassGain);

        // Melody loop (90s arcade style)
        this.intervalId = window.setInterval(() => {
            if (!this.isPlaying) return;
            
            const freq = melody[noteIndex % melody.length];
            this.playNote(freq, 0.2, 'square');
            
            // Harmony note
            if (noteIndex % 2 === 0) {
                this.playNote(freq * 1.5, 0.3, 'sine');
            }
            
            noteIndex++;
        }, 250); // Fast 90s tempo
    }

    private playBossMelody() {
        if (!this.ctx || !this.masterGain) return;

        // Intense boss music - aggressive arpeggio
        const notes = [131, 165, 196, 165]; // C3, E3, G3, E3
        let noteIndex = 0;

        // Aggressive bass
        const bass = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bass.type = 'sawtooth';
        bass.frequency.setValueAtTime(65, this.ctx.currentTime);
        bassGain.gain.value = 0.15;
        bass.connect(bassGain);
        bassGain.connect(this.masterGain);
        bass.start();
        this.oscillators.push(bass);
        this.gainNodes.push(bassGain);

        // Fast arpeggio
        this.intervalId = window.setInterval(() => {
            if (!this.isPlaying) return;
            
            const freq = notes[noteIndex % notes.length];
            this.playNote(freq, 0.15, 'square');
            this.playNote(freq * 2, 0.1, 'triangle');
            
            noteIndex++;
        }, 150); // Very fast for intensity
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

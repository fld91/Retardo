import React, { useEffect, useRef, useState } from 'react';
import { SoundManager } from '../../shared/SoundManager';
import { WaveManager } from './systems/WaveManager';
import { UpgradeSystem } from './systems/UpgradeSystem';
import UpgradeMenu from './components/UpgradeMenu';
import type { Upgrade } from './types';

// Types
interface GameState {
    player: {
        x: number;
        y: number;
        angle: number; // Radian
        color: string;
        health: number;
        maxHealth: number;
    };
    bullets: Bullet[];
    enemyBullets: Bullet[];
    enemies: Enemy[];
    particles: Particle[];
    score: number;
    scrap: number;
    gameOver: boolean;
}

interface Bullet {
    x: number;
    y: number;
    angle: number;
    speed: number;
    life: number;
    color: string;
}

interface Enemy {
    x: number;
    y: number;
    speed: number;
    size: number;
    hp: number;
    angle: number;
    type: 'chaser' | 'shooter';
    lastFire: number;
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface ControllerPacket {
    aim?: { dx: number; dy: number };
    move?: { x: number; y: number };
    fire?: boolean;
    reload?: boolean;
    ads?: boolean;
    timestamp?: number;
    server_ts?: number;
}

interface GameProps {
    onBack: () => void;
}

const Game: React.FC<GameProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState<string>("Connecting...");
    const [score, setScore] = useState<number>(0);
    const [playerHp, setPlayerHp] = useState<number>(100);
    const [gameOver, setGameOver] = useState<boolean>(false);
    const [sensitivity, setSensitivity] = useState<number>(4.0);

    const sensitivityRef = useRef<number>(4.0);
    const soundManager = useRef<SoundManager>(new SoundManager());
    const wsRef = useRef<WebSocket | null>(null);
    const waveManager = useRef<WaveManager>(new WaveManager());
    const upgradeSystem = useRef<UpgradeSystem>(new UpgradeSystem());

    const [scrap, setScrap] = useState<number>(0);
    const [showUpgradeMenu, setShowUpgradeMenu] = useState<boolean>(false);
    const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);
    const [waveNumber, setWaveNumber] = useState<number>(1);
    const [sector, setSector] = useState<number>(1);

    // Images (Background only)
    const imgBg = useRef<HTMLImageElement>(new Image());

    useEffect(() => {
        imgBg.current.src = './space_bg.png';
        sensitivityRef.current = sensitivity;
    }, [sensitivity]);

    const state = useRef<GameState>({
        player: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            angle: -Math.PI / 2,
            color: '#00ffff',
            health: 100,
            maxHealth: 100
        },
        bullets: [],
        enemyBullets: [],
        enemies: [],
        particles: [],
        score: 0,
        scrap: 0,
        gameOver: false
    });

    // Reset Game
    const resetGame = () => {
        state.current = {
            player: {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                angle: -Math.PI / 2,
                color: '#00ffff',
                health: upgradeSystem.current.maxHealth,
                maxHealth: upgradeSystem.current.maxHealth
            },
            bullets: [],
            enemyBullets: [],
            enemies: [],
            particles: [],
            score: 0,
            scrap: 0,
            gameOver: false
        };
        waveManager.current.reset();
        upgradeSystem.current.reset();
        setGameOver(false);
        setScore(0);
        setScrap(0);
        setPlayerHp(upgradeSystem.current.maxHealth);
        setWaveNumber(1);
        setSector(1);
        waveManager.current.startWave();
    };

    useEffect(() => {
        // WebSocket Connection
        const wsUrl = `ws://${window.location.hostname}:8080`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => setStatus("CONNECTED");
        ws.onclose = () => setStatus("DISCONNECTED");
        ws.onerror = () => setStatus("CONNECTION ERROR");

        ws.onmessage = (event) => {
            try {
                const data: ControllerPacket = JSON.parse(event.data);
                handleInput(data);
            } catch (e) {
                console.error(e);
            }
        };

        const handleInput = (data: ControllerPacket) => {
            if (state.current.gameOver) {
                // If game over, "Fire" button resets
                if (data.fire) resetGame();
                return;
            }

            soundManager.current.resume();

            if (data.aim) {
                state.current.player.angle += data.aim.dx * sensitivityRef.current * 0.05;
            }
            if (data.move) {
                const speed = 6 * upgradeSystem.current.speedMultiplier;
                state.current.player.x += data.move.x * speed;
                state.current.player.y += data.move.y * speed;

                // Clamp
                state.current.player.x = Math.max(20, Math.min(window.innerWidth - 20, state.current.player.x));
                state.current.player.y = Math.max(20, Math.min(window.innerHeight - 20, state.current.player.y));
            }
            if (data.fire) {
                shoot();
            }
        };

        const shoot = () => {
            // Rate limit handled by phone, but good to check here too if needed
            const bulletsToFire = upgradeSystem.current.bulletsPerShot;
            const bulletSpeed = 20 * upgradeSystem.current.bulletSpeedMultiplier;
            
            for (let i = 0; i < bulletsToFire; i++) {
                const spread = (i - (bulletsToFire - 1) / 2) * 0.1;
                state.current.bullets.push({
                    x: state.current.player.x,
                    y: state.current.player.y,
                    angle: state.current.player.angle + spread,
                    speed: bulletSpeed,
                    life: 60,
                    color: '#00ffff'
                });
            }
            soundManager.current.playShoot();
        };

        const spawnParticles = (x: number, y: number, color: string, count: number) => {
            for (let i = 0; i < count; i++) {
                state.current.particles.push({
                    x, y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 20 + Math.random() * 20,
                    color,
                    size: Math.random() * 4 + 1
                });
            }
        };

        // Game Loop
        let animationFrameId: number;
        const loop = () => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (canvas && ctx) {
                update(canvas.width, canvas.height);
                draw(ctx, canvas.width, canvas.height);
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        const update = (w: number, h: number) => {
            if (state.current.gameOver) return;

            const s = state.current;
            const now = Date.now();

            // Spawn Enemies (Wave-based)
            if (waveManager.current.shouldSpawnEnemy(s.enemies.length)) {
                const edge = Math.floor(Math.random() * 4);
                let ex = 0, ey = 0;
                if (edge === 0) { ex = Math.random() * w; ey = -50; }
                else if (edge === 1) { ex = w + 50; ey = Math.random() * h; }
                else if (edge === 2) { ex = Math.random() * w; ey = h + 50; }
                else { ex = -50; ey = Math.random() * h; }

                const type = Math.random() > 0.7 ? 'shooter' : 'chaser';

                s.enemies.push({
                    x: ex, y: ey,
                    speed: type === 'chaser' ? 4 : 2,
                    size: type === 'chaser' ? 20 : 30,
                    hp: type === 'chaser' ? 1 : 3,
                    angle: 0,
                    type,
                    lastFire: 0
                });
                waveManager.current.onEnemySpawned();
            }

            // Check wave completion
            if (waveManager.current.isWaveComplete(s.enemies.length)) {
                // Wave cleared!
                const options = upgradeSystem.current.generateUpgradeOptions();
                setUpgradeOptions(options);
                setShowUpgradeMenu(true);
            }

            // Update Bullets (Player)
            for (let i = s.bullets.length - 1; i >= 0; i--) {
                const b = s.bullets[i];
                b.x += Math.cos(b.angle) * b.speed;
                b.y += Math.sin(b.angle) * b.speed;
                b.life--;

                // Collision with Enemies
                let hit = false;
                for (let j = s.enemies.length - 1; j >= 0; j--) {
                    const e = s.enemies[j];
                    const dist = Math.hypot(b.x - e.x, b.y - e.y);
                    if (dist < e.size + 10) {
                        e.hp--;
                        hit = true;
                        spawnParticles(b.x, b.y, '#ffff00', 3);
                        if (e.hp <= 0) {
                            s.enemies.splice(j, 1);
                            const scoreGain = e.type === 'shooter' ? 200 : 50;
                            const scrapGain = e.type === 'shooter' ? 30 : 15;
                            s.score += scoreGain;
                            s.scrap += scrapGain;
                            setScore(s.score);
                            setScrap(s.scrap);
                            upgradeSystem.current.addScrap(scrapGain);
                            waveManager.current.onEnemyKilled();
                            spawnParticles(e.x, e.y, '#ff4500', 15);
                            soundManager.current.playExplosion();
                        }
                        break;
                    }
                }

                if (hit || b.life <= 0) s.bullets.splice(i, 1);
            }

            // Update Bullets (Enemy)
            for (let i = s.enemyBullets.length - 1; i >= 0; i--) {
                const b = s.enemyBullets[i];
                b.x += Math.cos(b.angle) * b.speed;
                b.y += Math.sin(b.angle) * b.speed;
                b.life--;

                // Collision with Player
                const dist = Math.hypot(b.x - s.player.x, b.y - s.player.y);
                if (dist < 20) { // Player radius approx 20
                    const damage = 10 * (1 - upgradeSystem.current.damageResistance);
                    s.player.health -= damage;
                    setPlayerHp(s.player.health);
                    s.enemyBullets.splice(i, 1);
                    spawnParticles(b.x, b.y, '#00ffff', 5);
                    soundManager.current.playExplosion(); // Reuse sound
                    if (s.player.health <= 0) {
                        s.gameOver = true;
                        setGameOver(true);
                    }
                    continue;
                }

                if (b.life <= 0) s.enemyBullets.splice(i, 1);
            }

            // Update Enemies
            for (let i = s.enemies.length - 1; i >= 0; i--) {
                const e = s.enemies[i];
                const dx = s.player.x - e.x;
                const dy = s.player.y - e.y;
                const distToPlayer = Math.hypot(dx, dy);
                const angleToPlayer = Math.atan2(dy, dx);

                e.angle = angleToPlayer;

                // Move
                if (distToPlayer > 100 || e.type === 'chaser') {
                    e.x += Math.cos(e.angle) * e.speed;
                    e.y += Math.sin(e.angle) * e.speed;
                }

                // Crash into player
                if (distToPlayer < e.size + 15) {
                    s.player.health = 0;
                    setPlayerHp(0);
                    s.gameOver = true;
                    setGameOver(true);
                    spawnParticles(s.player.x, s.player.y, '#00ffff', 50);
                }

                // Shoot
                if (e.type === 'shooter' && now - e.lastFire > 2000) {
                    if (distToPlayer < 600) {
                        s.enemyBullets.push({
                            x: e.x, y: e.y,
                            angle: angleToPlayer,
                            speed: 8,
                            life: 100,
                            color: '#ff0055'
                        });
                        e.lastFire = now;
                    }
                }
            }

            // Particles
            for (let i = s.particles.length - 1; i >= 0; i--) {
                const p = s.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                if (p.life <= 0) s.particles.splice(i, 1);
            }
        };

        const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
            // Background
            if (imgBg.current.complete) {
                const ptrn = ctx.createPattern(imgBg.current, 'repeat');
                if (ptrn) {
                    ctx.save();
                    ctx.translate(-state.current.player.x * 0.1, -state.current.player.y * 0.1);
                    ctx.fillStyle = ptrn;
                    ctx.fillRect(state.current.player.x * 0.1, state.current.player.y * 0.1, w, h);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);
                }
            } else {
                ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h);
            }

            const p = state.current.player;

            // Aimline
            if (!state.current.gameOver) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(800, 0);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 10]);
                ctx.stroke();
                ctx.restore();
            }

            // Particles
            for (const part of state.current.particles) {
                ctx.fillStyle = part.color;
                ctx.globalAlpha = part.life / 30;
                ctx.beginPath();
                ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            // Bullets
            for (const b of state.current.bullets) {
                ctx.fillStyle = b.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
            for (const b of state.current.enemyBullets) {
                ctx.fillStyle = b.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Enemies (Vector Graphics)
            for (const e of state.current.enemies) {
                ctx.save();
                ctx.translate(e.x, e.y);
                ctx.rotate(e.angle);

                ctx.shadowBlur = 10;
                ctx.shadowColor = '#ff0000';
                ctx.lineWidth = 3;

                if (e.type === 'chaser') {
                    // Triangle Insect
                    ctx.strokeStyle = '#ff3300';
                    ctx.beginPath();
                    ctx.moveTo(15, 0);
                    ctx.lineTo(-10, 10);
                    ctx.lineTo(-5, 0);
                    ctx.lineTo(-10, -10);
                    ctx.closePath();
                    ctx.stroke();
                } else {
                    // Shooter Ship
                    ctx.strokeStyle = '#ff0055';
                    ctx.beginPath();
                    ctx.moveTo(10, 0);
                    ctx.lineTo(-10, 15);
                    ctx.lineTo(-5, 0);
                    ctx.lineTo(-10, -15);
                    ctx.closePath();
                    ctx.stroke();
                    // Glow Core
                    ctx.fillStyle = 'rgba(255, 0, 85, 0.5)';
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // Player (Player should be hidden if dead)
            if (!state.current.gameOver) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);

                ctx.shadowBlur = 15;
                ctx.shadowColor = '#00ffff';
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#00ffff';

                // Vector Ship
                ctx.beginPath();
                ctx.moveTo(20, 0);
                ctx.lineTo(-15, 12);
                ctx.lineTo(-10, 0);
                ctx.lineTo(-15, -12);
                ctx.closePath();
                ctx.stroke();

                // Engine Flame
                ctx.shadowColor = '#0088ff';
                ctx.strokeStyle = '#0088ff';
                ctx.beginPath();
                ctx.moveTo(-12, 0);
                ctx.lineTo(-25, 0);
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.restore();
            }
        };

        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        loop();

        return () => {
            wsRef.current?.close();
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    // Upgrade Menu Handlers
    const handleSelectUpgrade = (upgrade: Upgrade) => {
        if (upgradeSystem.current.purchaseUpgrade(upgrade)) {
            setScrap(upgradeSystem.current.getScrap());
            setShowUpgradeMenu(false);
            
            // Start next wave
            if (waveManager.current.nextWave()) {
                setWaveNumber(waveManager.current.getWaveNumber());
                setSector(waveManager.current.getSector());
                waveManager.current.startWave();
                
                // Reset player health for new wave
                state.current.player.health = upgradeSystem.current.maxHealth;
                state.current.player.maxHealth = upgradeSystem.current.maxHealth;
                setPlayerHp(upgradeSystem.current.maxHealth);
            } else {
                // Campaign complete!
                alert('Campaign Complete! You defeated all 25 waves!');
                resetGame();
            }
        }
    };

    const handleSkipUpgrade = () => {
        setShowUpgradeMenu(false);
        
        // Start next wave
        if (waveManager.current.nextWave()) {
            setWaveNumber(waveManager.current.getWaveNumber());
            setSector(waveManager.current.getSector());
            waveManager.current.startWave();
        } else {
            // Campaign complete!
            alert('Campaign Complete! You defeated all 25 waves!');
            resetGame();
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden' }}>
            {/* Upgrade Menu */}
            {showUpgradeMenu && (
                <UpgradeMenu 
                    options={upgradeOptions}
                    scrap={upgradeSystem.current.getScrap()}
                    onSelect={handleSelectUpgrade}
                    onSkip={handleSkipUpgrade}
                />
            )}

            {/* UI Overlay */}
            <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none', fontFamily: "'Outfit', monospace" }}>
                {/* Score & Status */}
                <div>
                    <h2 style={{ margin: 0, textShadow: '0 0 10px cyan', fontSize: '2rem', color: 'white' }}>SCORE: {score}</h2>
                    <div style={{ fontSize: '0.8rem', color: status === "CONNECTED" ? '#0f0' : '#888', marginTop: 5 }}>
                        STATUS: {status}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#ffaa00', marginTop: 10 }}>
                        SCRAP: {Math.floor(scrap)}
                    </div>
                    <div style={{ fontSize: '1rem', color: '#fff', marginTop: 10, fontWeight: 'bold' }}>
                        SECTOR {sector} - WAVE {waveNumber}
                    </div>
                </div>

                {/* Health Bar */}
                <div style={{ width: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', marginBottom: '5px' }}>
                        <span>SHIELD INTEGRITY</span>
                        <span>{Math.floor(playerHp)}/{upgradeSystem.current.maxHealth}</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px' }}>
                        <div style={{
                            width: `${Math.max(0, (playerHp / upgradeSystem.current.maxHealth) * 100)}%`,
                            height: '100%',
                            background: playerHp > upgradeSystem.current.maxHealth * 0.3 ? '#00ffff' : '#ff0000',
                            borderRadius: '5px',
                            boxShadow: `0 0 10px ${playerHp > upgradeSystem.current.maxHealth * 0.3 ? '#00ffff' : '#ff0000'}`,
                            transition: 'width 0.2s'
                        }} />
                    </div>
                </div>
            </div>

            {/* Exit / Controls */}
            <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: '20px', alignItems: 'flex-end', zIndex: 20 }}>
                {/* Sensitivity */}
                <div style={{ background: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 10, color: 'white', fontFamily: 'monospace' }}>
                    <label>SENSITIVITY: {sensitivity}</label>
                    <br />
                    <input
                        type="range" min="1" max="10" step="0.1"
                        value={sensitivity}
                        onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                        style={{ width: '150px', cursor: 'pointer', accentColor: 'cyan' }}
                    />
                </div>

                {/* Exit Button */}
                <button
                    onClick={onBack}
                    style={{
                        background: '#ff0055', color: 'white', border: 'none',
                        padding: '15px 30px', borderRadius: '10px',
                        fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                        boxShadow: '0 0 15px #ff0055'
                    }}
                >
                    EXIT
                </button>
            </div>

            {/* Game Over Screen */}
            {gameOver && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(20, 0, 0, 0.85)', backdropFilter: 'blur(5px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, color: 'white', fontFamily: "'Outfit', monospace"
                }}>
                    <h1 style={{ fontSize: '5rem', margin: 0, color: '#ff0055', textShadow: '0 0 30px #ff0055' }}>MISSION FAILED</h1>
                    <h2 style={{ fontSize: '2rem', marginTop: '10px' }}>FINAL SCORE: {score}</h2>
                    <p style={{ fontSize: '1.2rem', color: '#ffaa00', marginTop: '10px' }}>Reached Wave {waveNumber}</p>
                    <p style={{ color: '#aaa', marginTop: '20px' }}>PRESS "FIRE" ON CONTROLLER TO RESTART</p>
                    <div style={{ marginTop: '40px', display: 'flex', gap: '20px' }}>
                        <button
                            onClick={resetGame}
                            style={{
                                padding: '15px 40px', background: 'white', color: 'black',
                                border: 'none', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer',
                                borderRadius: '30px'
                            }}
                        >
                            RESTART
                        </button>
                        <button
                            onClick={onBack}
                            style={{
                                padding: '15px 40px', background: 'transparent', color: 'white',
                                border: '2px solid white', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer',
                                borderRadius: '30px'
                            }}
                        >
                            MAIN MENU
                        </button>
                    </div>
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
    );
};

export default Game;

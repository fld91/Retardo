import React, { useEffect, useRef, useState } from 'react';
import { SoundManager } from '../../shared/SoundManager';
import { MusicManager } from '../../shared/MusicManager';
import { WaveManager } from './systems/WaveManager';
import { UpgradeSystem } from './systems/UpgradeSystem';
import UpgradeMenu from './components/UpgradeMenu';
import BossHealthBar from './components/BossHealthBar';
import type { Upgrade, EnemyType } from './types';
import { getEnemyDefinition, EnemyAI } from './entities/EnemyFactory';
import { BOSS_DEFINITIONS, BossAI, type Boss } from './entities/BossFactory';

// Types
interface GameState {
    player: {
        x: number;
        y: number;
        angle: number;
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
    boss: Boss | null;
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
    id: string;
    x: number;
    y: number;
    speed: number;
    size: number;
    hp: number;
    maxHp: number;
    angle: number;
    type: EnemyType;
    lastFire: number;
    color: string;
    shield?: number;
    orbitAngle?: number;
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
    const musicManager = useRef<MusicManager>(new MusicManager());
    const wsRef = useRef<WebSocket | null>(null);
    const waveManager = useRef<WaveManager>(new WaveManager());
    const upgradeSystem = useRef<UpgradeSystem>(new UpgradeSystem());

    const [scrap, setScrap] = useState<number>(0);
    const [showUpgradeMenu, setShowUpgradeMenu] = useState<boolean>(false);
    const [upgradeOptions, setUpgradeOptions] = useState<Upgrade[]>([]);
    const [waveNumber, setWaveNumber] = useState<number>(1);
    const [sector, setSector] = useState<number>(1);
    const [musicEnabled, setMusicEnabled] = useState<boolean>(false); // Disabled by default

    // Images (Background only)
    const imgBg = useRef<HTMLImageElement>(new Image());

    useEffect(() => {
        imgBg.current.src = './space_bg.png';
        sensitivityRef.current = sensitivity;
        // Start first wave on mount
        waveManager.current.startWave();
        
        // Start sector 1 music
        if (musicEnabled) {
            musicManager.current.play('sector1');
        }
        
        return () => {
            musicManager.current.stop();
        };
    }, [sensitivity, musicEnabled]);

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
        gameOver: false,
        boss: null
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
            gameOver: false,
            boss: null
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
            if (state.current.gameOver || showUpgradeMenu) return;

            const s = state.current;
            const now = Date.now();

            // Spawn Enemies (Wave-based)
            if (waveManager.current.shouldSpawnEnemy(s.enemies.length)) {
                // Spawn from top and sides only (0=top, 1=right, 2=left)
                const edge = Math.floor(Math.random() * 3);
                let ex = 0, ey = 0;
                if (edge === 0) { 
                    // Top
                    ex = Math.random() * w; 
                    ey = -50; 
                } else if (edge === 1) { 
                    // Right
                    ex = w + 50; 
                    ey = Math.random() * h; 
                } else { 
                    // Left
                    ex = -50; 
                    ey = Math.random() * h; 
                }

                // Get available enemy types from wave
                const waveData = waveManager.current.getCurrentWave();
                const availableTypes = waveData.enemyTypes;
                const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                const enemyDef = getEnemyDefinition(randomType);

                s.enemies.push({
                    id: `enemy_${Date.now()}_${Math.random()}`,
                    x: ex, y: ey,
                    speed: enemyDef.speed,
                    size: enemyDef.size,
                    hp: enemyDef.hp,
                    maxHp: enemyDef.hp,
                    angle: 0,
                    type: enemyDef.type,
                    lastFire: 0,
                    color: enemyDef.color,
                    shield: enemyDef.type === 'shieldbearer' ? 3 : undefined
                });
                waveManager.current.onEnemySpawned();
            }

            // Check wave completion
            if (waveManager.current.isWaveComplete(s.enemies.length) && !showUpgradeMenu && !s.boss) {
                const currentWave = waveManager.current.getWaveNumber();
                const isBossWave = currentWave % 5 === 0; // Boss every 5 waves
                
                if (isBossWave) {
                    // Spawn boss
                    const bossNumber = Math.ceil(currentWave / 5);
                    const bossIndex = Math.min(bossNumber, 2); // Max 2 bosses defined for now
                    const bossDef = BOSS_DEFINITIONS[bossIndex];
                    
                    if (bossDef) {
                        s.boss = {
                            id: `boss_${bossNumber}`,
                            name: bossDef.name,
                            x: w / 2,
                            y: -100, // Spawn from top
                            angle: Math.PI / 2,
                            hp: bossDef.hp,
                            maxHp: bossDef.hp,
                            size: bossDef.size,
                            color: bossDef.color,
                            currentPhase: bossIndex,
                            lastFire: 0,
                            lastAction: 0
                        };
                        
                        // Play boss music
                        if (musicEnabled) {
                            musicManager.current.play('boss');
                        }
                    }
                } else {
                    // Wave cleared! Generate options once
                    const options = upgradeSystem.current.generateUpgradeOptions();
                    setUpgradeOptions(options);
                    setShowUpgradeMenu(true);
                }
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
                        // Check shield first
                        if (e.shield && e.shield > 0) {
                            e.shield--;
                            hit = true;
                            spawnParticles(b.x, b.y, '#0088ff', 3);
                        } else if (e.hp <= 0) {
                            const enemyDef = getEnemyDefinition(e.type);
                            s.enemies.splice(j, 1);
                            s.score += enemyDef.scoreValue;
                            s.scrap += enemyDef.scrapValue;
                            setScore(s.score);
                            setScrap(s.scrap);
                            upgradeSystem.current.addScrap(enemyDef.scrapValue);
                            waveManager.current.onEnemyKilled();
                            spawnParticles(e.x, e.y, e.color, 15);
                            soundManager.current.playExplosion();

                            // Splitter special: Create 2 scouts on death
                            if (e.type === 'splitter') {
                                for (let k = 0; k < 2; k++) {
                                    const scoutDef = getEnemyDefinition('scout');
                                    s.enemies.push({
                                        id: `scout_split_${Date.now()}_${k}`,
                                        x: e.x + (k === 0 ? -20 : 20),
                                        y: e.y,
                                        speed: scoutDef.speed,
                                        size: scoutDef.size,
                                        hp: scoutDef.hp,
                                        maxHp: scoutDef.hp,
                                        angle: 0,
                                        type: 'scout',
                                        lastFire: 0,
                                        color: scoutDef.color
                                    });
                                }
                            }
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
                    if (s.player.health <= 0 && !s.gameOver) {
                        s.gameOver = true;
                        setGameOver(true);
                        soundManager.current.playExplosion();
                    }
                    continue;
                }

                if (b.life <= 0) s.enemyBullets.splice(i, 1);
            }

            // Update Enemies
            const deltaTime = 16; // ~60fps
            for (let i = s.enemies.length - 1; i >= 0; i--) {
                const e = s.enemies[i];
                const dx = s.player.x - e.x;
                const dy = s.player.y - e.y;
                const distToPlayer = Math.hypot(dx, dy);
                const angleToPlayer = Math.atan2(dy, dx);

                // Use AI behaviors
                switch (e.type) {
                    case 'scout':
                        EnemyAI.updateScout(e, s.player.x, s.player.y, deltaTime);
                        break;
                    case 'stinger':
                        EnemyAI.updateStinger(e, s.player.x, s.player.y, deltaTime);
                        break;
                    case 'weaver':
                        EnemyAI.updateWeaver(e, s.player.x, s.player.y, deltaTime);
                        break;
                    case 'splitter':
                        EnemyAI.updateSplitter(e, s.player.x, s.player.y, deltaTime);
                        break;
                    case 'shieldbearer':
                        EnemyAI.updateShieldbearer(e, s.player.x, s.player.y, deltaTime);
                        break;
                }

                // Crash into player
                if (distToPlayer < e.size + 15) {
                    if (!s.gameOver) {
                        s.player.health = 0;
                        setPlayerHp(0);
                        s.gameOver = true;
                        setGameOver(true);
                        spawnParticles(s.player.x, s.player.y, '#00ffff', 50);
                        soundManager.current.playExplosion();
                    }
                }

                // Shooting enemies (stinger, weaver)
                const canShoot = e.type === 'stinger' || e.type === 'weaver';
                if (canShoot && now - e.lastFire > 2000) {
                    if (distToPlayer < 600) {
                        s.enemyBullets.push({
                            x: e.x, y: e.y,
                            angle: angleToPlayer,
                            speed: 8,
                            life: 100,
                            color: e.color
                        });
                        e.lastFire = now;
                    }
                }
            }

            // Update Boss
            if (s.boss) {
                const spawnScout = () => {
                    const scoutDef = getEnemyDefinition('scout');
                    const angle = Math.random() * Math.PI * 2;
                    s.enemies.push({
                        id: `boss_scout_${Date.now()}`,
                        x: s.boss!.x + Math.cos(angle) * 100,
                        y: s.boss!.y + Math.sin(angle) * 100,
                        speed: scoutDef.speed,
                        size: scoutDef.size,
                        hp: scoutDef.hp,
                        maxHp: scoutDef.hp,
                        angle: 0,
                        type: 'scout',
                        lastFire: 0,
                        color: scoutDef.color
                    });
                };

                BossAI.update(s.boss, s.player.x, s.player.y, deltaTime, spawnScout);

                // Boss collision with player
                const bossDistToPlayer = Math.hypot(s.boss.x - s.player.x, s.boss.y - s.player.y);
                if (bossDistToPlayer < s.boss.size + 15 && !s.gameOver) {
                    s.player.health = 0;
                    setPlayerHp(0);
                    s.gameOver = true;
                    setGameOver(true);
                    spawnParticles(s.player.x, s.player.y, '#00ffff', 50);
                    soundManager.current.playExplosion();
                }

                // Boss shooting
                const bossDef = BOSS_DEFINITIONS[s.boss.currentPhase];
                if (bossDef && now - s.boss.lastFire > 1000) {
                    const angleToPlayer = Math.atan2(s.player.y - s.boss.y, s.player.x - s.boss.x);
                    // Spread shot
                    for (let i = -1; i <= 1; i++) {
                        s.enemyBullets.push({
                            x: s.boss.x,
                            y: s.boss.y,
                            angle: angleToPlayer + (i * 0.2),
                            speed: 6,
                            life: 120,
                            color: s.boss.color
                        });
                    }
                    s.boss.lastFire = now;
                }

                // Boss hit by bullets
                for (let i = s.bullets.length - 1; i >= 0; i--) {
                    const b = s.bullets[i];
                    const distToBoss = Math.hypot(b.x - s.boss.x, b.y - s.boss.y);
                    if (distToBoss < s.boss.size) {
                        s.boss.hp -= 1;
                        s.bullets.splice(i, 1);
                        spawnParticles(b.x, b.y, s.boss.color, 5);
                        
                        if (s.boss.hp <= 0) {
                            // Boss defeated!
                            const bossDef = BOSS_DEFINITIONS[s.boss.currentPhase];
                            s.score += bossDef.scoreValue;
                            s.scrap += bossDef.scrapValue;
                            setScore(s.score);
                            setScrap(s.scrap);
                            upgradeSystem.current.addScrap(bossDef.scrapValue);
                            spawnParticles(s.boss.x, s.boss.y, s.boss.color, 50);
                            soundManager.current.playExplosion();
                            s.boss = null;
                            
                            // Resume sector music after boss
                            const currentSector = waveManager.current.getSector();
                            if (musicEnabled) {
                                musicManager.current.play(`sector${currentSector}` as any);
                            }
                            
                            // Show upgrade menu after boss
                            const options = upgradeSystem.current.generateUpgradeOptions();
                            setUpgradeOptions(options);
                            setShowUpgradeMenu(true);
                        }
                        break;
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

            // HUD - Render on canvas
            ctx.font = 'bold 24px monospace';
            ctx.fillStyle = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 10;
            ctx.fillText(`SCORE: ${state.current.score}`, 20, 40);
            
            ctx.font = '14px monospace';
            ctx.fillStyle = status === 'CONNECTED' ? '#0f0' : '#888';
            ctx.shadowBlur = 0;
            ctx.fillText(`STATUS: ${status}`, 20, 65);
            
            ctx.fillStyle = '#ffaa00';
            ctx.fillText(`SCRAP: ${Math.floor(state.current.scrap)}`, 20, 85);
            
            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText(`SECTOR ${sector} - WAVE ${waveNumber}`, 20, 110);
            
            // Health Bar (top right)
            const barWidth = 300;
            const barHeight = 20;
            const barX = w - barWidth - 20;
            const barY = 20;
            
            ctx.font = '12px monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText(`SHIELD: ${Math.floor(state.current.player.health)}/${upgradeSystem.current.maxHealth}`, barX, barY - 5);
            
            // Bar background
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Bar fill
            const healthPercent = state.current.player.health / upgradeSystem.current.maxHealth;
            ctx.fillStyle = healthPercent > 0.3 ? '#00ffff' : '#ff0000';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            ctx.shadowBlur = 0;

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
                ctx.shadowColor = e.color;
                ctx.lineWidth = 3;
                ctx.strokeStyle = e.color;

                // Draw based on type
                switch(e.type) {
                    case 'scout':
                        // Triangle
                        ctx.beginPath();
                        ctx.moveTo(15, 0);
                        ctx.lineTo(-10, 10);
                        ctx.lineTo(-5, 0);
                        ctx.lineTo(-10, -10);
                        ctx.closePath();
                        ctx.stroke();
                        break;

                    case 'stinger':
                        // Diamond with core
                        ctx.beginPath();
                        ctx.moveTo(10, 0);
                        ctx.lineTo(-10, 15);
                        ctx.lineTo(-5, 0);
                        ctx.lineTo(-10, -15);
                        ctx.closePath();
                        ctx.stroke();
                        ctx.fillStyle = `${e.color}80`;
                        ctx.fill();
                        break;

                    case 'weaver':
                        // Hexagon
                        ctx.beginPath();
                        for (let i = 0; i < 6; i++) {
                            const angle = (Math.PI / 3) * i;
                            const x = Math.cos(angle) * 15;
                            const y = Math.sin(angle) * 15;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                        break;

                    case 'splitter':
                        // Star shape
                        ctx.beginPath();
                        for (let i = 0; i < 10; i++) {
                            const angle = (Math.PI / 5) * i;
                            const radius = i % 2 === 0 ? 15 : 7;
                            const x = Math.cos(angle - Math.PI / 2) * radius;
                            const y = Math.sin(angle - Math.PI / 2) * radius;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                        break;

                    case 'shieldbearer':
                        // Large octagon
                        ctx.beginPath();
                        for (let i = 0; i < 8; i++) {
                            const angle = (Math.PI / 4) * i;
                            const x = Math.cos(angle) * 18;
                            const y = Math.sin(angle) * 18;
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.stroke();

                        // Shield indicator
                        if (e.shield && e.shield > 0) {
                            ctx.strokeStyle = '#0088ff';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.arc(0, 0, 25, 0, (e.shield / 3) * Math.PI * 2);
                            ctx.stroke();
                        }
                        break;
                }

                ctx.shadowBlur = 0;
                ctx.restore();
            }

            // Boss Rendering
            if (state.current.boss) {
                const boss = state.current.boss;
                ctx.save();
                ctx.translate(boss.x, boss.y);
                ctx.rotate(boss.angle);

                ctx.shadowBlur = 20;
                ctx.shadowColor = boss.color;
                ctx.lineWidth = 5;
                ctx.strokeStyle = boss.color;

                // Large octagon for boss
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI / 4) * i;
                    const x = Math.cos(angle) * boss.size;
                    const y = Math.sin(angle) * boss.size;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.stroke();
                ctx.fillStyle = `${boss.color}30`;
                ctx.fill();

                // Core glow
                ctx.fillStyle = boss.color;
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();

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
                
                // Change music when sector changes
                const newSector = waveManager.current.getSector();
                setSector(newSector);
                if (musicEnabled && !state.current.boss) {
                    musicManager.current.play(`sector${newSector}` as any);
                }
                
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

            {/* Boss Health Bar */}
            {state.current.boss && (
                <BossHealthBar 
                    bossName={state.current.boss.name}
                    currentHp={state.current.boss.hp}
                    maxHp={state.current.boss.maxHp}
                />
            )}


            {/* Exit / Controls */}
            <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: '20px', alignItems: 'flex-end', zIndex: 20 }}>
                {/* Music Toggle */}
                <button
                    onClick={() => {
                        const newState = !musicEnabled;
                        setMusicEnabled(newState);
                        if (newState) {
                            const currentSector = waveManager.current.getSector();
                            if (state.current.boss) {
                                musicManager.current.play('boss');
                            } else {
                                musicManager.current.play(`sector${currentSector}` as any);
                            }
                        } else {
                            musicManager.current.stop();
                        }
                    }}
                    style={{
                        background: musicEnabled ? '#00ff88' : '#333',
                        color: 'white',
                        border: '2px solid white',
                        padding: '15px 20px',
                        borderRadius: '10px',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        boxShadow: musicEnabled ? '0 0 15px #00ff88' : 'none',
                        transition: 'all 0.3s'
                    }}
                >
                    {musicEnabled ? '🎵' : '🔇'}
                </button>
                
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

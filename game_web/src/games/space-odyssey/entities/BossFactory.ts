// Boss entities for Space Odyssey

import type { EnemyType } from '../types';

export interface BossDefinition {
    name: string;
    hp: number;
    size: number;
    color: string;
    scoreValue: number;
    scrapValue: number;
    phases: BossPhase[];
}

export interface BossPhase {
    healthThreshold: number; // HP % when this phase activates
    behavior: 'spawn_minions' | 'charge' | 'shoot_pattern' | 'teleport';
    speed: number;
    fireRate: number;
}

export interface Boss {
    id: string;
    name: string;
    x: number;
    y: number;
    angle: number;
    hp: number;
    maxHp: number;
    size: number;
    color: string;
    currentPhase: number;
    lastFire: number;
    lastAction: number;
    orbitAngle?: number;
}

export const BOSS_DEFINITIONS: Record<number, BossDefinition> = {
    1: {
        name: 'Hive Overseer',
        hp: 500,
        size: 80,
        color: '#ff00ff',
        scoreValue: 2000,
        scrapValue: 500,
        phases: [
            {
                healthThreshold: 100,
                behavior: 'spawn_minions',
                speed: 1.5,
                fireRate: 1500
            },
            {
                healthThreshold: 50,
                behavior: 'charge',
                speed: 3,
                fireRate: 1000
            },
            {
                healthThreshold: 25,
                behavior: 'shoot_pattern',
                speed: 2,
                fireRate: 500
            }
        ]
    },
    2: {
        name: 'Corrupted Cruiser',
        hp: 750,
        size: 100,
        color: '#00ff00',
        scoreValue: 3000,
        scrapValue: 750,
        phases: [
            {
                healthThreshold: 100,
                behavior: 'shoot_pattern',
                speed: 1,
                fireRate: 800
            },
            {
                healthThreshold: 50,
                behavior: 'spawn_minions',
                speed: 1.5,
                fireRate: 600
            }
        ]
    }
    // More bosses can be added later
};

export class BossAI {
    static update(boss: Boss, playerX: number, playerY: number, deltaTime: number, spawnMinion?: () => void) {
        const dx = playerX - boss.x;
        const dy = playerY - boss.y;
        const dist = Math.hypot(dx, dy);
        boss.angle = Math.atan2(dy, dx);

        const def = BOSS_DEFINITIONS[boss.currentPhase === 0 ? 1 : boss.currentPhase];
        if (!def) return;

        const healthPercent = (boss.hp / boss.maxHp) * 100;
        const phase = def.phases.find(p => healthPercent <= p.healthThreshold && healthPercent > (p.healthThreshold - 33)) || def.phases[0];

        switch (phase.behavior) {
            case 'spawn_minions':
                // Slow circle movement
                if (!boss.orbitAngle) boss.orbitAngle = 0;
                boss.orbitAngle += 0.01;
                boss.x += Math.cos(boss.orbitAngle) * phase.speed;
                boss.y += Math.sin(boss.orbitAngle) * phase.speed;
                
                // Spawn scouts periodically
                const now = Date.now();
                if (spawnMinion && now - boss.lastAction > 3000) {
                    spawnMinion();
                    boss.lastAction = now;
                }
                break;

            case 'charge':
                // Move toward player aggressively
                if (dist > 50) {
                    boss.x += Math.cos(boss.angle) * phase.speed;
                    boss.y += Math.sin(boss.angle) * phase.speed;
                }
                break;

            case 'shoot_pattern':
                // Maintain distance and shoot
                if (dist > 300) {
                    boss.x += Math.cos(boss.angle) * phase.speed;
                    boss.y += Math.sin(boss.angle) * phase.speed;
                } else if (dist < 200) {
                    boss.x -= Math.cos(boss.angle) * phase.speed;
                    boss.y -= Math.sin(boss.angle) * phase.speed;
                }
                break;
        }
    }
}

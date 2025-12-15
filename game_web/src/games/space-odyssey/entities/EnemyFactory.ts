// Enemy factory and behaviors for Space Odyssey

import type { EnemyType } from '../types';

export interface EnemyDefinition {
    type: EnemyType;
    hp: number;
    speed: number;
    size: number;
    color: string;
    scoreValue: number;
    scrapValue: number;
}

export const ENEMY_DEFINITIONS: Record<EnemyType, EnemyDefinition> = {
    scout: {
        type: 'scout',
        hp: 1,
        speed: 4,
        size: 20,
        color: '#ff3300',
        scoreValue: 50,
        scrapValue: 15
    },
    stinger: {
        type: 'stinger',
        hp: 3,
        speed: 2,
        size: 30,
        color: '#ff0055',
        scoreValue: 200,
        scrapValue: 30
    },
    weaver: {
        type: 'weaver',
        hp: 5,
        speed: 3,
        size: 25,
        color: '#aa00ff',
        scoreValue: 300,
        scrapValue: 45
    },
    splitter: {
        type: 'splitter',
        hp: 6,
        speed: 2.5,
        size: 28,
        color: '#ffaa00',
        scoreValue: 400,
        scrapValue: 60
    },
    shieldbearer: {
        type: 'shieldbearer',
        hp: 8,
        speed: 1.5,
        size: 35,
        color: '#0088ff',
        scoreValue: 500,
        scrapValue: 75
    }
};

export function getEnemyDefinition(type: EnemyType): EnemyDefinition {
    return ENEMY_DEFINITIONS[type];
}

// Enemy AI behaviors
export class EnemyAI {
    // Chaser/Scout: Move directly toward player
    static updateScout(enemy: any, playerX: number, playerY: number, deltaTime: number) {
        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;
        enemy.angle = Math.atan2(dy, dx);
        enemy.x += Math.cos(enemy.angle) * enemy.speed;
        enemy.y += Math.sin(enemy.angle) * enemy.speed;
    }

    // Stinger/Shooter: Maintain distance, shoot periodically
    static updateStinger(enemy: any, playerX: number, playerY: number, deltaTime: number) {
        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;
        const dist = Math.hypot(dx, dy);
        enemy.angle = Math.atan2(dy, dx);

        // Maintain shooting distance (150-250 pixels)
        if (dist > 250) {
            enemy.x += Math.cos(enemy.angle) * enemy.speed;
            enemy.y += Math.sin(enemy.angle) * enemy.speed;
        } else if (dist < 150) {
            enemy.x -= Math.cos(enemy.angle) * enemy.speed;
            enemy.y -= Math.sin(enemy.angle) * enemy.speed;
        }
    }

    // Weaver: Circular strafe pattern
    static updateWeaver(enemy: any, playerX: number, playerY: number, deltaTime: number) {
        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;
        const distToPlayer = Math.hypot(dx, dy);
        const angleToPlayer = Math.atan2(dy, dx);

        // Initialize orbit angle if needed
        if (!enemy.orbitAngle) enemy.orbitAngle = 0;
        enemy.orbitAngle += 0.02; // Rotation speed

        // Maintain orbit distance
        const orbitRadius = 200;
        const targetX = playerX + Math.cos(enemy.orbitAngle) * orbitRadius;
        const targetY = playerY + Math.sin(enemy.orbitAngle) * orbitRadius;

        // Move toward orbit position
        const dxOrbit = targetX - enemy.x;
        const dyOrbit = targetY - enemy.y;
        const angleToOrbit = Math.atan2(dyOrbit, dxOrbit);

        enemy.x += Math.cos(angleToOrbit) * enemy.speed;
        enemy.y += Math.sin(angleToOrbit) * enemy.speed;
        
        // Face player
        enemy.angle = angleToPlayer;
    }

    // Splitter: Nothing special until death (handled in game logic)
    static updateSplitter(enemy: any, playerX: number, playerY: number, deltaTime: number) {
        // Same as scout
        EnemyAI.updateScout(enemy, playerX, playerY, deltaTime);
    }

    // Shieldbearer: Slow tank with shield
    static updateShieldbearer(enemy: any, playerX: number, playerY: number, deltaTime: number) {
        const dx = playerX - enemy.x;
        const dy = playerY - enemy.y;
        enemy.angle = Math.atan2(dy, dx);
        
        // Move slowly
        enemy.x += Math.cos(enemy.angle) * enemy.speed;
        enemy.y += Math.sin(enemy.angle) * enemy.speed;

        // Shield regeneration (0.5 HP per second, max 3)
        if (!enemy.shield) enemy.shield = 3;
        if (enemy.shield < 3) {
            enemy.shield += 0.5 * deltaTime / 1000;
            enemy.shield = Math.min(3, enemy.shield);
        }
    }
}

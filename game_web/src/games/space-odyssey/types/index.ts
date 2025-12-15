// Core game types for Space Odyssey

export interface Enemy {
    id: string;
    x: number;
    y: number;
    angle: number;
    speed: number;
    size: number;
    hp: number;
    maxHp: number;
    type: EnemyType;
    lastFire: number;
    color: string;
}

export type EnemyType = 'scout' | 'stinger' | 'weaver' | 'splitter' | 'shieldbearer';

export interface Bullet {
    x: number;
    y: number;
    angle: number;
    speed: number;
    life: number;
    color: string;
    damage: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

export interface Player {
    x: number;
    y: number;
    angle: number;
    color: string;
    health: number;
    maxHealth: number;
    shield: number;
    maxShield: number;
}

export interface Upgrade {
    id: string;
    name: string;
    description: string;
    category: 'weapon' | 'defense' | 'mobility';
    icon: string;
    cost: number;
    effect: () => void;
}

export interface Wave {
    number: number;
    sector: number;
    enemyCount: number;
    enemyTypes: EnemyType[];
    spawnRate: number;
    isBoss: boolean;
}

export interface GameStats {
    kills: number;
    accuracy: number;
    shotsFired: number;
    shotsHit: number;
    scrapCollected: number;
    damageDealt: number;
    damageTaken: number;
    combo:number;
    highestCombo: number;
}

import type { Wave, EnemyType } from '../types';

export class WaveManager {
    private currentWave: number = 1;
    private currentSector: number = 1;
    private enemiesSpawned: number = 0;
    private enemiesKilled: number = 0;
    private waveActive: boolean = false;
    private waveData: Wave[] = [];

    constructor() {
        this.generateWaveData();
    }

    private generateWaveData() {
        // Generate 25 waves (5 sectors × 5 waves each)
        for (let sector = 1; sector <= 5; sector++) {
            for (let wave = 1; wave <= 5; wave++) {
                const waveNumber = (sector - 1) * 5 + wave;
                const isBoss = wave === 5;

                // Progressive difficulty
                const baseCount = 5 + (waveNumber - 1) * 2;
                const enemyCount = isBoss ? 1 : Math.min(baseCount, 15);

                // Enemy type distribution based on wave
                let enemyTypes: EnemyType[] = ['scout'];
                if (waveNumber >= 3) enemyTypes.push('stinger');
                if (waveNumber >= 6) enemyTypes.push('weaver');
                if (waveNumber >= 10) enemyTypes.push('splitter');
                if (waveNumber >= 15) enemyTypes.push('shieldbearer');

                this.waveData.push({
                    number: waveNumber,
                    sector,
                    enemyCount,
                    enemyTypes,
                    spawnRate: Math.max(0.01, 0.05 - waveNumber * 0.001),
                    isBoss
                });
            }
        }
    }

    startWave() {
        this.waveActive = true;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
    }

    getCurrentWave(): Wave {
        return this.waveData[this.currentWave - 1];
    }

    shouldSpawnEnemy(currentEnemyCount: number): boolean {
        const wave = this.getCurrentWave();
        if (!this.waveActive) return false;
        if (this.enemiesSpawned >= wave.enemyCount) return false;
        if (currentEnemyCount >= 8) return false; // Max concurrent enemies
        
        return Math.random() < wave.spawnRate;
    }

    onEnemySpawned() {
        this.enemiesSpawned++;
    }

    onEnemyKilled() {
        this.enemiesKilled++;
    }

    isWaveComplete(currentEnemyCount: number): boolean {
        if (!this.waveActive) return false;
        const wave = this.getCurrentWave();
        return this.enemiesKilled >= wave.enemyCount && currentEnemyCount === 0;
    }

    nextWave(): boolean {
        if (this.currentWave >= 25) return false; // Campaign complete
        this.currentWave++;
        this.currentSector = Math.ceil(this.currentWave / 5);
        this.waveActive = false;
        return true;
    }

    getWaveNumber(): number {
        return this.currentWave;
    }

    getSector(): number {
        return this.currentSector;
    }

    getProgress(): { spawned: number; killed: number; total: number } {
        const wave = this.getCurrentWave();
        return {
            spawned: this.enemiesSpawned,
            killed: this.enemiesKilled,
            total: wave.enemyCount
        };
    }

    reset() {
        this.currentWave = 1;
        this.currentSector = 1;
        this.enemiesSpawned = 0;
        this.enemiesKilled = 0;
        this.waveActive = false;
    }
}

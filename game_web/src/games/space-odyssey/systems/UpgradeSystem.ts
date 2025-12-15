import type { Upgrade } from '../types';

export class UpgradeSystem {
    private activeUpgrades: Set<string> = new Set();
    private scrap: number = 0;

    // Player stat modifiers
    public weaponDamageMultiplier: number = 1.0;
    public fireRateMultiplier: number = 1.0;
    public bulletSpeedMultiplier: number = 1.0;
    public bulletsPerShot: number = 1;
    
    public maxHealth: number = 100;
    public shieldStrength: number = 0;
    public damageResistance: number = 0;
    public healthRegen: number = 0;
    
    public speedMultiplier: number = 1.0;

    constructor() {}

    addScrap(amount: number) {
        this.scrap += amount;
    }

    getScrap(): number {
        return this.scrap;
    }

    hasUpgrade(id: string): boolean {
        return this.activeUpgrades.has(id);
    }

    // Generate 3 random upgrade options
    generateUpgradeOptions(): Upgrade[] {
        const allUpgrades: Upgrade[] = [
            // Weapon upgrades
            {
                id: 'dual_cannons',
                name: 'Dual Cannons',
                description: 'Fire 2 bullets per shot',
                category: 'weapon',
                icon: '⚡',
                cost: 100,
                effect: () => {
                    this.bulletsPerShot = 2;
                }
            },
            {
                id: 'rapid_fire',
                name: 'Rapid Fire',
                description: '+50% fire rate',
                category: 'weapon',
                icon: '🔥',
                cost: 100,
                effect: () => {
                    this.fireRateMultiplier *= 1.5;
                }
            },
            {
                id: 'plasma_bolts',
                name: 'Plasma Bolts',
                description: '+50% bullet speed',
                category: 'weapon',
                icon: '💨',
                cost: 80,
                effect: () => {
                    this.bulletSpeedMultiplier *= 1.5;
                }
            },
            {
                id: 'heavy_rounds',
                name: 'Heavy Rounds',
                description: '+50% damage',
                category: 'weapon',
                icon: '💥',
                cost: 120,
                effect: () => {
                    this.weaponDamageMultiplier *= 1.5;
                }
            },
            // Defense upgrades
            {
                id: 'shield_boost',
                name: 'Shield Boost',
                description: '+25 max health',
                category: 'defense',
                icon: '🛡️',
                cost: 100,
                effect: () => {
                    this.maxHealth += 25;
                }
            },
            {
                id: 'armor_plating',
                name: 'Armor Plating',
                description: '20% damage reduction',
                category: 'defense',
                icon: '🔰',
                cost: 120,
                effect: () => {
                    this.damageResistance = 0.2;
                }
            },
            {
                id: 'regen_field',
                name: 'Regen Field',
                description: '+1 HP per second',
                category: 'defense',
                icon: '💚',
                cost: 150,
                effect: () => {
                    this.healthRegen = 1;
                }
            },
            // Mobility upgrades
            {
                id: 'afterburner',
                name: 'Afterburner',
                description: '+30% movement speed',
                category: 'mobility',
                icon: '🚀',
                cost: 80,
                effect: () => {
                    this.speedMultiplier *= 1.3;
                }
            }
        ];

        // Filter out already owned upgrades
        const available = allUpgrades.filter(u => !this.activeUpgrades.has(u.id));
        
        // Shuffle and pick 3
        const shuffled = available.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 3);
    }

    purchaseUpgrade(upgrade: Upgrade) {
        if (this.scrap < upgrade.cost) return false;
        if (this.activeUpgrades.has(upgrade.id)) return false;

        this.scrap -= upgrade.cost;
        this.activeUpgrades.add(upgrade.id);
        upgrade.effect();
        return true;
    }

    reset() {
        this.activeUpgrades.clear();
        this.scrap = 0;
        this.weaponDamageMultiplier = 1.0;
        this.fireRateMultiplier = 1.0;
        this.bulletSpeedMultiplier = 1.0;
        this.bulletsPerShot = 1;
        this.maxHealth = 100;
        this.shieldStrength = 0;
        this.damageResistance = 0;
        this.healthRegen = 0;
        this.speedMultiplier = 1.0;
    }
}

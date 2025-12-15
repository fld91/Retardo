import React from 'react';
import type { Upgrade } from '../types';

interface UpgradeMenuProps {
    options: Upgrade[];
    scrap: number;
    onSelect: (upgrade: Upgrade) => void;
    onSkip: () => void;
}

const UpgradeMenu: React.FC<UpgradeMenuProps> = ({ options, scrap, onSelect, onSkip }) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 20, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            fontFamily: "'Outfit', monospace"
        }}>
            <h1 style={{ 
                fontSize: '3rem', 
                margin: '0 0 10px 0', 
                color: '#00ffff',
                textShadow: '0 0 20px #00ffff'
            }}>
                WAVE CLEARED
            </h1>
            
            <p style={{ color: '#aaa', fontSize: '1.2rem', marginBottom: '40px' }}>
                Scrap Available: <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>{scrap}</span>
            </p>

            <div style={{
                display: 'flex',
                gap: '30px',
                marginBottom: '40px'
            }}>
                {options.map((upgrade) => {
                    const canAfford = scrap >= upgrade.cost;
                    const categoryColor = {
                        weapon: '#ff0055',
                        defense: '#00ff88',
                        mobility: '#00aaff'
                    }[upgrade.category];

                    return (
                        <div
                            key={upgrade.id}
                            onClick={() => canAfford && onSelect(upgrade)}
                            style={{
                                width: '280px',
                                padding: '30px',
                                background: canAfford ? 'rgba(255,255,255,0.05)' : 'rgba(100,100,100,0.1)',
                                border: `2px solid ${canAfford ? categoryColor : '#444'}`,
                                borderRadius: '15px',
                                cursor: canAfford ? 'pointer' : 'not-allowed',
                                transition: 'all 0.3s',
                                opacity: canAfford ? 1 : 0.5,
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            onMouseEnter={(e) => {
                                if (canAfford) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = `0 0 30px ${categoryColor}`;
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Category badge */}
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                padding: '5px 10px',
                                background: categoryColor,
                                color: 'black',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                borderRadius: '5px',
                                textTransform: 'uppercase'
                            }}>
                                {upgrade.category}
                            </div>

                            {/* Icon */}
                            <div style={{
                                fontSize: '4rem',
                                textAlign: 'center',
                                marginBottom: '15px'
                            }}>
                                {upgrade.icon}
                            </div>

                            {/* Title */}
                            <h3 style={{
                                fontSize: '1.5rem',
                                margin: '0 0 10px 0',
                                color: 'white',
                                textAlign: 'center'
                            }}>
                                {upgrade.name}
                            </h3>

                            {/* Description */}
                            <p style={{
                                fontSize: '0.9rem',
                                color: '#ccc',
                                textAlign: 'center',
                                minHeight: '40px',
                                margin: '0 0 20px 0'
                            }}>
                                {upgrade.description}
                            </p>

                            {/* Cost */}
                            <div style={{
                                textAlign: 'center',
                                padding: '10px',
                                background: canAfford ? 'rgba(255,170,0,0.2)' : 'rgba(100,0,0,0.2)',
                                borderRadius: '8px',
                                color: canAfford ? '#ffaa00' : '#ff3333',
                                fontWeight: 'bold',
                                fontSize: '1.1rem'
                            }}>
                                {upgrade.cost} SCRAP
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={onSkip}
                style={{
                    padding: '15px 60px',
                    background: 'transparent',
                    border: '2px solid #666',
                    color: '#999',
                    fontSize: '1rem',
                    borderRadius: '30px',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#fff';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#666';
                    e.currentTarget.style.color = '#999';
                }}
            >
                SKIP UPGRADE
            </button>

            <p style={{ 
                color: '#666', 
                fontSize: '0.8rem', 
                marginTop: '20px',
                fontStyle: 'italic'
            }}>
                Choose wisely - upgrades are permanent for this run
            </p>
        </div>
    );
};

export default UpgradeMenu;

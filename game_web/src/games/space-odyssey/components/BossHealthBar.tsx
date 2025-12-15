import React from 'react';

interface BossHealthBarProps {
    bossName: string;
    currentHp: number;
    maxHp: number;
}

const BossHealthBar: React.FC<BossHealthBarProps> = ({ bossName, currentHp, maxHp }) => {
    const healthPercent = (currentHp / maxHp) * 100;
    
    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            padding: '20px',
            background: 'rgba(20, 0, 0, 0.9)',
            border: '3px solid #ff0055',
            borderRadius: '15px',
            boxShadow: '0 0 30px #ff0055',
            zIndex: 50,
            fontFamily: "'Outfit', monospace",
            pointerEvents: 'none'
        }}>
            {/* Boss Name */}
            <h2 style={{
                margin: '0 0 15px 0',
                fontSize: '2rem',
                color: '#ff0055',
                textAlign: 'center',
                textShadow: '0 0 15px #ff0055',
                letterSpacing: '2px'
            }}>
                ⚠️ {bossName.toUpperCase()} ⚠️
            </h2>

            {/* HP Counter */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '1.2rem',
                color: '#fff'
            }}>
                <span>HP</span>
                <span>{Math.floor(currentHp)} / {maxHp}</span>
            </div>

            {/* Health Bar */}
            <div style={{
                width: '100%',
                height: '30px',
                background: 'rgba(255,255,255,0.1)',
                border: '2px solid #666',
                borderRadius: '5px',
                overflow: 'hidden',
                position: 'relative'
            }}>
                {/* Bar fill */}
                <div style={{
                    width: `${Math.max(0, healthPercent)}%`,
                    height: '100%',
                    background: healthPercent > 50 
                        ? 'linear-gradient(90deg, #ff00ff, #ff0055)' 
                        : healthPercent > 25 
                        ? 'linear-gradient(90deg, #ff8800, #ff0055)'
                        : 'linear-gradient(90deg, #ff0000, #aa0000)',
                    boxShadow: healthPercent > 25 ? '0 0 20px #ff0055' : '0 0 20px #ff0000',
                    transition: 'width 0.3s, background 0.5s'
                }} />

                {/* Percentage text overlay */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: '#fff',
                    textShadow: '2px 2px 4px #000'
                }}>
                    {Math.floor(healthPercent)}%
                </div>
            </div>

            {/* Phase Indicator */}
            <div style={{
                marginTop: '10px',
                textAlign: 'center',
                fontSize: '0.9rem',
                color: healthPercent > 50 ? '#ffaa00' : healthPercent > 25 ? '#ff6600' : '#ff0000',
                fontStyle: 'italic'
            }}>
                {healthPercent > 66 ? 'Phase 1' : healthPercent > 33 ? 'Phase 2 - ENRAGED!' : 'Phase 3 - CRITICAL!'}
            </div>
        </div>
    );
};

export default BossHealthBar;

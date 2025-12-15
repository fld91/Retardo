import React from 'react';

interface PlatformHomeProps {
    onLaunch: () => void;
}

const PlatformHome: React.FC<PlatformHomeProps> = ({ onLaunch }) => {
    return (
        <div style={{
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #1a0b2e 0%, #000000 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Outfit', sans-serif"
        }}>
            <h1 style={{ fontSize: '4rem', margin: '0', textShadow: '0 0 20px #bf00ff' }}>GENESIS</h1>
            <h2 style={{ letterSpacing: '5px', color: '#ccc' }}>GAMING PLATFORM</h2>

            <div style={{
                marginTop: '50px',
                display: 'flex',
                gap: '20px'
            }}>
                {/* Game Card */}
                <div style={{
                    width: '300px',
                    height: '400px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
                    onClick={onLaunch}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <img src="./planet.png" alt="Space Odyssey" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
                    <h3 style={{ marginTop: '20px', fontSize: '1.5rem' }}>SPACE ODYSSEY</h3>
                    <p style={{ textAlign: 'center', color: '#888' }}>
                        Defend deep space from the insectoid invasion using your phone as a weapon.
                    </p>
                    <button style={{
                        marginTop: 'auto',
                        padding: '10px 30px',
                        background: '#00ccff',
                        border: 'none',
                        borderRadius: '30px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}>PLAY NOW</button>
                </div>

                {/* Placeholder Card */}
                <div style={{
                    width: '300px',
                    height: '400px',
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '20px',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.5
                }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#555' }}>COMING SOON</h3>
                    <p>REALISTIC 3D FPS</p>
                </div>
            </div>
        </div>
    );
};

export default PlatformHome;

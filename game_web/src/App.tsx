import { useState } from 'react';
import SpaceOdysseyGame from './games/space-odyssey/SpaceOdysseyGame';
import PlatformHome from './platform/PlatformHome';
import './App.css';

function App() {
  const [screen, setScreen] = useState<'home' | 'space_odyssey'>('home');

  return (
    <>
      {screen === 'home' && <PlatformHome onLaunch={() => setScreen('space_odyssey')} />}
      {screen === 'space_odyssey' && <SpaceOdysseyGame onBack={() => setScreen('home')} />}
    </>
  );
}

export default App;

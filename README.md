# Genesis Gaming Platform 🎮

A revolutionary gaming platform featuring phone-as-controller gameplay and immersive arcade experiences.

## 🌟 What's Inside

### 1. Space Odyssey - Retro Arcade Space Shooter ⭐

An intense arcade-style space shooter with 25 waves, boss battles, and upgrade progression.

### 2. Phone Controller

Turn your smartphone into a wireless game controller using gyroscope and accelerometer.

---

## 📂 Project Structure

```
Retardo/
├── relay_server/          # Node.js WebSocket relay server
├── game_web/              # React-based game platform (Vite + TypeScript)
│   └── src/
│       ├── games/
│       │   └── space-odyssey/    # Space Odyssey game
│       ├── shared/               # SoundManager, MusicManager
│       ├── PlatformHome.tsx      # Game launcher
│       └── App.tsx
└── controller_app/        # Flutter phone controller app
```

---

## 🚀 Quick Start Guide

### Step 1: Start the Relay Server

The relay server connects your phone controller to the game.

```bash
cd relay_server
npm install
node server.js
```

**Note the IP address** shown in console (e.g., `192.168.1.5:8080`)

---

### Step 2: Launch the Game

```bash
cd game_web
npm install
npm run dev
```

Open browser to: `http://localhost:5173`

You'll see the **Genesis Gaming Platform** launcher.

---

### Step 3: Connect Phone Controller

**Requirements:**

- Physical Android phone (not emulator - needs gyroscope)
- Phone and PC on same WiFi network

**Setup:**

```bash
cd controller_app
flutter pub get
flutter run --release
```

**In the app:**

1. Enter your PC's IP address (from Step 1): `192.168.1.5:8080`
2. Tap **CONNECT**
3. See "GYRO AIM ACTIVE" on phone
4. Game shows "CONNECTED"

---

## 🎮 Space Odyssey - Gameplay Guide

### Starting the Game

1. Launch `game_web` (see Step 2 above)
2. Click **"Space Odyssey"** on the platform
3. Game starts immediately!

### How to Play

**Goal**: Survive 25 waves across 5 sectors, defeat all bosses.

**Gameplay Loop:**

1. **Destroy enemies** - Shoot them down
2. **Collect scrap** - Dropped from defeated enemies
3. **Clear wave** - Eliminate all enemies
4. **Choose upgrade** - Spend scrap on enhancements
5. **Face bosses** - Every 5th wave (5, 10, 15, 20, 25)

---

### 🎯 Controls

**Phone Controller (Recommended)**

- **Aim**: Tilt phone (gyroscope)
- **Move**: Left joystick
- **Fire**: Right fire button
- **Haptic**: Feel strong vibration when hit!

**Settings:**

- Sensitivity slider: 1-10 (bottom right)
- Music toggle: 🎵/🔇 button

---

### 👾 Enemy Types

| Enemy               | Color  | Behavior                            |
| ------------------- | ------ | ----------------------------------- |
| **Scout** 🔵        | Blue   | Fast, weak, basic attacks           |
| **Stinger** 🔴      | Red    | Aggressive pursuit                  |
| **Weaver** 🟡       | Yellow | Orbital strafing                    |
| **Splitter** 🟣     | Purple | Splits into 2 scouts when destroyed |
| **Shieldbearer** 🟢 | Green  | Regenerating shield                 |

---

### 🔥 Boss Battles

**Wave 5, 15, 25:** Hive Overseer (500 HP)

- Spawns scout minions
- Charges at player
- 3-way spread shot

**Wave 10, 20:** Corrupted Cruiser (750 HP)

- Heavy firepower
- Aggressive patterns
- Fast arpeggio attacks

**Boss Features:**

- Health bar displayed on canvas above boss
- Color-coded HP (purple → orange → red)
- Multi-phase behavior
- Defeat for massive scrap reward!

---

### ⚡ Upgrade System

Spend scrap on 8 powerful upgrades:

**🔫 Weapon Upgrades**

- **Dual Cannons** (100) - Fire 2 bullets per shot
- **Rapid Fire** (100) - +50% fire rate
- **Plasma Bolts** (80) - +50% bullet speed
- **Heavy Rounds** (120) - +50% damage

**🛡️ Defense Upgrades**

- **Shield Boost** (100) - +25 max health
- **Armor Plating** (120) - 20% damage reduction
- **Regen Field** (150) - +1 HP per second

**🚀 Mobility Upgrades**

- **Afterburner** (80) - +30% movement speed

---

### 🎵 Audio Features

**Music:**

- 5 unique sector themes (retro 90s style)
- Intense boss battle music
- Toggle on/off with button

**Sound Effects:**

- Weapon fire
- Enemy explosions
- Wave completion chime
- Enemy hit sounds

---

## � Visual Features

- **HUD**: Score, scrap, sector/wave, connection status
- **Health Bar**: Glowing cyan bar (top right)
- **Boss Health**: On-canvas bar above boss
- **Particle Effects**: Explosions, enemy destruction
- **Wave Announcements**: Tekken-style "WAVE 1", "BOSS FIGHT!"
- **Star Field**: Subtle animated background

---

## 🔧 Troubleshooting

### Game Won't Start

- Ensure you ran `npm install` in `game_web`
- Check browser console for errors
- Try `npm run dev` again

### No Enemies Spawning

- Refresh the page
- Enemies spawn after a brief delay

### Music Not Playing

- Click the music toggle button (🎵)
- Music is enabled by default

### Performance Issues

- Disable music for better FPS
- Close other browser tabs
- Use Chrome/Edge for best performance

### Phone Controller Issues

**Won't Connect:**

- Verify IP address matches relay server
- Check both devices on same WiFi
- Restart relay server

**No Vibration:**

- Check phone vibration permissions
- Ensure Android settings allow vibration

**Poor Aiming:**

- Increase sensitivity (slider 1-20)
- Calibrate by holding phone steady
- Avoid rapid shaking

---

## 🎯 Tips & Strategies

### Early Waves (1-5)

- Focus on collecting scrap
- Prioritize weapon upgrades first
- Learn enemy patterns

### Mid Game (6-15)

- Get at least one defense upgrade
- Save scrap for boss waves
- Use Dual Cannons + Rapid Fire combo

### Late Game (16-25)

- Max out armor and shields
- Heavy Rounds essential for bosses
- Plasma Bolts help with fast enemies

### Boss Strategy

- Keep moving in circles
- Focus fire when boss charges
- Dodge spread shots
- Watch for phase transitions

---

## 🛠️ Technical Stack

- **Frontend**: React 18, TypeScript, Vite
- **Canvas Rendering**: HTML5 Canvas API
- **Audio**: Web Audio API (procedural synthesis)
- **Controller**: Flutter (Dart)
- **Server**: Node.js, WebSocket (`ws` package)
- **Real-time**: WebSocket communication (<50ms latency)

---

## 📱 Phone Controller Details

### Features

- Gyroscope aiming (tilt control)
- Accelerometer-based movement
- Haptic feedback (200ms vibration on hit)
- Low-latency streaming (~30-50ms)

### Supported Platforms

- Android devices with gyroscope
- Requires physical device (no emulator support)

---

## 🚀 Future Roadmap

### Space Odyssey

- [ ] Visual polish (parallax, screen shake)
- [ ] Meta progression (achievements, skins)
- [ ] More enemy & boss types
- [ ] Additional game modes

### Platform

- [ ] Tactical Breach 3D FPS (planned)
- [ ] Multiplayer support
- [ ] Leaderboards
- [ ] Cloud save

---

## 📄 License

MIT License - Free to use and modify!

---

## 🎮 Ready to Play?

1. Start relay server: `cd relay_server && node server.js`
2. Launch game: `cd game_web && npm run dev`
3. Open `http://localhost:5173`
4. Click **Space Odyssey**
5. **Enjoy the retro arcade action!** 🚀

**Pro Tip**: Play with phone controller for the ultimate immersive experience with haptic feedback! 📱💥

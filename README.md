# 🔫 Phone-as-Gun Prototype

A low-latency prototyping platform where a Flutter mobile app acts as a physical gun controller for a browser-based shooting game.

## 📂 Project Structure

- `controller_app/`: Flutter mobile application (The "Gun").
- `relay_server/`: Node.js WebSocket server (The "Bridge").
- `game_client/`: HTML/JS Browser Game (The "Target").

## 🚀 Setup & Run Instructions

### 1. Start the Relay Server
The server relays messages from the phone to the browser.
```bash
cd relay_server
npm install
node server.js
```
*Take note of the IP address printed in the console (e.g., `192.168.1.X`).*

### 2. Launch the Game
Open the game in your browser.
- You can simply open `game_client/index.html` in your browser.
- **Note**: Ensure the browser and server are on the same machine or network.

### 3. Run the Mobile Controller
You must run this on a **Physical Device** (Emulators don't have gyroscope/accelerometer).
1. Connect your Android phone to PC via USB.
2. Enable USB Debugging.
3. Run the app:
```bash
cd controller_app
flutter run --release
```
*Note: `--release` mode is recommended for best performance and lowest latency.*

### 4. Connect
1. On the Phone App, enter your PC's IP address (displayed in server console) plus port 8080.
   - Example: `192.168.1.5:8080`
2. Tap **CONNECT**.
3. You should see "GYRO AIM ACTIVE" on the phone.
4. The Game on the browser should show "CONNECTED".

## 🎮 Controls

- **Aim**: Tilt/Rotate the phone (Gyroscope).
- **Move**: Use the on-screen Joystick (Left Thumb).
- **Fire**: Shake the phone sharply OR use Volume Up / On-screen Fire button.
- **Reload**: Volume Down OR On-screen Reload button.
- **ADS**: On-screen Toggle.

## 🛠️ Calibration & Troubleshooting

- **Latency**: Check the on-screen latency counter in the browser. Target is < 45ms.
- **Fire Sensitivity**: If unwanted firing occurs, adjust `_shakeThreshold` in `lib/controller_screen.dart`.
- **Network**: Ensure Phone and PC are on the same WiFi network. Windows Firewall might block the server; allow Node.js if prompted.

## 🧩 Architecture

- **Sensor Fusion**: Gyroscope X/Y rates are sent directly to the server.
- **Protocol**: JSON packets sent every 16ms (~60 FPS).
- **Relay**: The Node.js server broadcasts the latest packet to the game client immediately.
- **Prediction**: The game client interpolates movement but applies aim deltas directly for responsiveness.

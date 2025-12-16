const WebSocket = require('ws');
const ip = require('ip');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });
const localIP = ip.address();

console.log(`🔫 Relay Server running on ws://${localIP}:${PORT}`);
console.log(`Waiting for controller (phone) and game (browser) to connect...`);

let gameClients = [];
let controllerClient = null;

wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`New Client Connected from ${ip}! Total: ${wss.clients.size}`);

    ws.on('message', (message) => {
        try {
            // Assume the message is JSON.
            // For MVP, we just relay everything from controller to game.
            // Example format:
            // { "aim": { "dx": 0.45, "dy": -0.18 }, "fire": true, ... }

            // In a more robust setup, we'd check a "type" field.
            // For now, if it looks like controller data, broadcast to games.

            const data = JSON.parse(message);
            
            // DEBUG LOGGING
            if (data.type === 'vibrate') {
                console.log(`📳 Vibration request: ${data.duration}ms from ${ip}`);
            }

            // Add server timestamp for latency tracking
            data.server_ts = Date.now();

            // Broadcast to all other clients (Game)
            let broadcastCount = 0;
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                    broadcastCount++;
                }
            });
            
            if (data.type === 'vibrate' && broadcastCount === 0) {
                 console.warn("⚠️ Vibration sent but no clients connected to receive it!");
            }

        } catch (e) {
            console.error('Invalid message:', e);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log("Status: READY");

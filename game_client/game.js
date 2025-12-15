const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const uiStatus = document.getElementById('status');
const uiLatency = document.getElementById('latency');
const uiDebug = document.getElementById('debug');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game State
const state = {
    player: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        angle: 0,
        color: '#00ccff'
    },
    bullets: [],
    targets: [],
    lastPacketTime: 0,
    latency: 0,
    sensitivity: 2.0 // Multiplier for gyro deltas
};

// WebSocket Connection
// Replace 'localhost' with your PC's IP if testing on a different device on the same network
// But usually the browser is on the same PC as the server for this prototype.
const ws = new WebSocket(`ws://${window.location.hostname}:8080`);

ws.onopen = () => {
    uiStatus.innerText = "CONNECTED";
    uiStatus.style.color = "#0f0";
};

ws.onclose = () => {
    uiStatus.innerText = "DISCONNECTED";
    uiStatus.style.color = "#f00";
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Latency Calculation
    const now = Date.now();
    // Use timestamp from phone (data.timestamp is in seconds, need ms if possible, or assume it's ms)
    // The user said timestamp: 1728391023 (seconds). Let's handle both.
    let packetTime = data.timestamp;
    if (packetTime < 10000000000) packetTime *= 1000; // Convert sec to ms if needed

    // Total latency = current time - phone time
    // Note: This requires clocks to be synced. For a prototype, round-trip or relative jitter is often enough.
    // However, user asked for "End-to-end latency". We can approximate it or just measure "Server->Browser" latency
    // if clocks aren't synced. 
    // data.server_ts was added by our server.
    const networkLatency = now - data.server_ts;
    state.latency = networkLatency;
    uiLatency.innerText = `Net Latency: ${networkLatency}ms`;

    handleInput(data);
};

function handleInput(data) {
    if (data.aim) {
        // Gyro Aim (Delta)
        // Adjust angle by dx
        // We might want to invert dx depending on preference
        state.player.angle += data.aim.dx * state.sensitivity * 0.05;

        // Clamp vertical or use it for something else? 
        // For top-down 2D, we only care about rotation (yaw).
        // If data.aim.dx is horizontal movement
    }

    if (data.move) {
        // Joystick Move
        const speed = 5;
        state.player.x += data.move.x * speed;
        state.player.y += data.move.y * -speed; // y inverted usually
    }

    if (data.fire) {
        shoot();
    }

    if (data.reload) {
        // Reload logic
        console.log("Reload!");
    }

    uiDebug.innerText = `Aim: ${state.player.angle.toFixed(2)}`;
}

function shoot() {
    state.bullets.push({
        x: state.player.x,
        y: state.player.y,
        angle: state.player.angle,
        speed: 15,
        life: 100
    });
}

// Spawn random targets
setInterval(() => {
    if (state.targets.length < 5) {
        state.targets.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 20
        });
    }
}, 2000);

// Game Loop
function loop() {
    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Trail effect
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Player
    ctx.save();
    ctx.translate(state.player.x, state.player.y);
    ctx.rotate(state.player.angle);

    // Body
    ctx.fillStyle = state.player.color;
    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-10, 10);
    ctx.lineTo(-10, -10);
    ctx.fill();

    // Laser Sight
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(1000, 0);
    ctx.stroke();

    ctx.restore();

    // Update & Draw Bullets
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += Math.cos(b.angle) * b.speed;
        b.y += Math.sin(b.angle) * b.speed;
        b.life--;

        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Check collision with targets
        for (let j = state.targets.length - 1; j >= 0; j--) {
            const t = state.targets[j];
            const dx = b.x - t.x;
            const dy = b.y - t.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < t.size + 4) {
                // Hit
                state.targets.splice(j, 1);
                state.bullets.splice(i, 1);
                // Trigger visual hit marker (simple flash for now)
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(t.x, t.y, 30, 0, Math.PI * 2);
                ctx.fill();
                break;
            }
        }

        if (b.life <= 0) state.bullets.splice(i, 1);
    }

    // Draw Targets
    ctx.fillStyle = '#ff3333';
    for (const t of state.targets) {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
        ctx.fill();
    }

    requestAnimationFrame(loop);
}

loop();

// Resize handler
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_joystick/flutter_joystick.dart';
import 'package:sensors_plus/sensors_plus.dart';
import 'package:vibration/vibration.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:google_fonts/google_fonts.dart';

class ControllerScreen extends StatefulWidget {
  const ControllerScreen({super.key});

  @override
  State<ControllerScreen> createState() => _ControllerScreenState();
}

class _ControllerScreenState extends State<ControllerScreen> {
  // Connection
  final TextEditingController _ipController = TextEditingController(
    text: "192.168.1.7:8080",
  );
  WebSocketChannel? _channel;
  bool _isConnected = false;
  bool _isVibrating = false; // Visual feedback state
  Timer? _vibrationTimer; // For heartbeat patterns

  // Game State
  Offset _aim = const Offset(
    0,
    0,
  ); // Accumulator (optional, or just send raw gyro)
  Offset _move = const Offset(0, 0);
  bool _fire = false;
  bool _reload = false;
  bool _ads = false;

  // Sensors
  StreamSubscription? _gyroSub;
  StreamSubscription? _accelSub;

  // Logic Constants
  final double _shakeThreshold = 15.0; // m/s^2, tune this
  final int _fireCooldownMs = 150;
  int _lastFireTime = 0;

  // Loop
  Timer? _loopTimer;

  // flattened orientation tracking removed

  @override
  void initState() {
    super.initState();
    // Start listening to volume keys if possible through keyboard listener
    // Note: Volume keys are tricky on Flutter without native code,
    // we will rely on Shake + On-screen buttons mostly, but try RawKeyboardListener
  }

  @override
  void dispose() {
    _disconnect();
    _loopTimer?.cancel();
    super.dispose();
  }

  void _connect() {
    if (_ipController.text.isEmpty) return;

    // Auto-formatting
    String url = _ipController.text;
    if (!url.startsWith("ws://")) {
      url = "ws://$url";
    }

    try {
      _channel = WebSocketChannel.connect(Uri.parse(url));

      // Listen for messages (DATA FROM GAME CLIENT)
      _channel!.stream.listen(
        (message) {
          try {
            final data = jsonDecode(message);
            // Check for Haptic Feedback command
            if (data['type'] == 'vibrate') {
              int duration = data['duration'] ?? 100;

              // 1. Hardware Vibration
              Vibration.vibrate(duration: duration);

              // 2. Visual Feedback (Flash RED)
              setState(() {
                _isVibrating = true;
              });

              // Turn off visual flash after duration
              Future.delayed(Duration(milliseconds: duration), () {
                if (mounted) {
                  setState(() {
                    _isVibrating = false;
                  });
                }
              });
            }
            // Check for Pattern Command (Heartbeat)
            else if (data['type'] == 'heartbeat') {
              bool enabled = data['enabled'] ?? false;
              _vibrationTimer?.cancel();

              if (enabled) {
                // Heartbeat: 50ms pulse every 1000ms
                _vibrationTimer = Timer.periodic(
                  const Duration(milliseconds: 500),
                  (timer) {
                    Vibration.vibrate(duration: 50);
                  },
                );
              }
            }
          } catch (e) {
            // Ignore malformed data
          }
        },
        onError: (error) {
          _disconnect();
        },
        onDone: () {
          _disconnect();
        },
      );

      setState(() {
        _isConnected = true;
      });

      // Start Sensor Loop
      _startSensors();

      // Start Sending Loop (60 FPS)
      _loopTimer = Timer.periodic(const Duration(milliseconds: 16), (timer) {
        _sendPacket();
      });
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }

  void _disconnect() {
    _channel?.sink.close();
    _gyroSub?.cancel();
    _accelSub?.cancel();
    _loopTimer?.cancel();
    setState(() {
      _isConnected = false;
    });
  }

  void _startSensors() {
    // Gyroscope for AIM
    _gyroSub = gyroscopeEventStream().listen((GyroscopeEvent event) {
      // Mapping:
      // X axis -> horizontal aim (User requirement)
      // Y axis -> vertical aim (User requirement)
      // Actually usually Gyro Z is rotation in hand... but let's stick to user request.
      // We will send the raw rates (deltas) directly to server,
      // or we can accumulate locally?
      // User asked: "Convert gyro motion into delta aim"

      // Let's just store the rate and send it in the packet loop
      // Or integrate over 16ms?
      // Simpler: Send the instantaneous rate, clean it up on receiver or here.
      // Better: send movement delta = rate * dt

      const double dt = 0.016; // approx
      double dx = event.x * dt;
      double dy = event.y * dt;

      _aim = Offset(dx, dy);
    });

    // Accelerometer for SHAKE (Fire)
    _accelSub = userAccelerometerEventStream().listen((
      UserAccelerometerEvent event,
    ) {
      double mag = sqrt(
        event.x * event.x + event.y * event.y + event.z * event.z,
      );
      if (mag > _shakeThreshold) {
        _triggerFire();
      }
    });

    // Listen to Keyboard (Volume Buttons)
    // This requires focus, which might be tricky.
  }

  void _triggerFire() {
    int now = DateTime.now().millisecondsSinceEpoch;
    if (now - _lastFireTime > _fireCooldownMs) {
      _lastFireTime = now;
      _fire = true;
      Vibration.vibrate(duration: 50); // Haptic

      // Reset fire flag after a single frame or keep it for a bit?
      // We set it true, the loop will pick it up, then we set it false.
      Future.delayed(const Duration(milliseconds: 20), () {
        _fire = false;
      });
    }
  }

  void _sendPacket() {
    if (_channel == null || !_isConnected) return;

    final packet = {
      "aim": {"dx": _aim.dx, "dy": _aim.dy},
      "move": {"x": _move.dx, "y": _move.dy},
      "fire": _fire,
      "reload": _reload,
      "ads": _ads,
      "timestamp": DateTime.now().millisecondsSinceEpoch / 1000.0, // seconds
    };

    // Reset one-shot events
    // _fire is handled via timer or manual reset?
    // If we set _fire to true, we send it once.
    // To ensure it's not missed, maybe send for a few frames?
    // But sending once per packet interval is usually OK if TCP/WS.

    // Note: If logic sets _fire=true, we send it.
    // If we reset immediately after send, we are good.

    _channel?.sink.add(jsonEncode(packet));

    // Reset accumulated/one-shot values
    // _aim is delta over the frame?
    // If we use instantaneous rate, we don't reset.
    // However, if we are integrating, we should reset.
    // If we just take the last Gyro event, that's rate (per second).
    // We want to send delta angle to move.
    // So packet { aim: { dx: 0.05 ... } } means "move 0.05 radians/units this frame".
    // So we don't reset _aim if it's rate-based, BUT if we only capture last event, it might resolve to 0 if no event?
    // Gyro stream is fast.

    // Reset logic:
    _reload = false;
    // Fire is handled by _triggerFire logic (resets after 20ms)
    // Aim is continually updated by stream.
  }

  @override
  Widget build(BuildContext context) {
    if (!_isConnected) {
      return Scaffold(
        body: Center(
          child: Container(
            padding: const EdgeInsets.all(20),
            width: 400,
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.videogame_asset,
                  size: 50,
                  color: Colors.cyanAccent,
                ),
                const SizedBox(height: 20),
                Text(
                  "Connect to Relay Server",
                  style: GoogleFonts.outfit(fontSize: 20, color: Colors.white),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: _ipController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: "Server IP (e.g., 192.168.1.5:8080)",
                    border: OutlineInputBorder(),
                    filled: true,
                    fillColor: Colors.black54,
                  ),
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _connect,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.cyanAccent,
                    foregroundColor: Colors.black,
                  ),
                  child: const Text("CONNECT"),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return KeyboardListener(
      focusNode: FocusNode()..requestFocus(),
      onKeyEvent: (KeyEvent event) {
        if (event is KeyDownEvent) {
          // Volume keys?
          if (event.logicalKey.keyLabel.contains('Volume')) {
            // Up for fire?
            // Not reliable on all devices, but let's try
            if (event.logicalKey == LogicalKeyboardKey.audioVolumeUp) {
              _triggerFire();
            }
            if (event.logicalKey == LogicalKeyboardKey.audioVolumeDown) {
              setState(() => _reload = true);
            }
          }
        }
      },
      child: Scaffold(
        backgroundColor: _isVibrating
            ? Colors.redAccent.withOpacity(0.5)
            : null,
        body: Stack(
          children: [
            // Connection Status / HUD
            Positioned(
              left: 0,
              right: 0,
              top: 20,
              child: Center(
                child: Column(
                  children: [
                    Text(
                      "GYRO AIM ACTIVE",
                      style: GoogleFonts.outfit(
                        color: Colors.cyanAccent,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      "CONNECTED",
                      style: TextStyle(color: Colors.green, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),

            // Left Joystick (Movement)
            Positioned(
              left: 40,
              bottom: 40,
              child: Joystick(
                mode: JoystickMode.all,
                listener: (details) {
                  _move = Offset(details.x, details.y);
                },
              ),
            ),

            // Right Buttons
            Positioned(
              right: 40,
              bottom: 60,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Reload
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => setState(() => _reload = true),
                      borderRadius: BorderRadius.circular(30),
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.white54),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.refresh, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(width: 20),
                  // ADS Toggle
                  Material(
                    color: _ads
                        ? Colors.cyanAccent.withValues(alpha: 0.3)
                        : Colors.transparent,
                    child: InkWell(
                      onTap: () => setState(() => _ads = !_ads),
                      borderRadius: BorderRadius.circular(30),
                      child: Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.cyanAccent),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.center_focus_strong,
                          color: _ads ? Colors.cyanAccent : Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 20),
                  // FIRE Touch Button (Backup)
                  GestureDetector(
                    onTapDown: (_) => _triggerFire(),
                    child: Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.redAccent.withValues(alpha: 0.5),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.red),
                      ),
                      child: const Center(
                        child: Text(
                          "FIRE",
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Aim Debug
            Positioned(
              top: 10,
              right: 10,
              child: Text(
                "Aim: ${_aim.dx.toStringAsFixed(2)}, ${_aim.dy.toStringAsFixed(2)}",
                style: const TextStyle(color: Colors.white24),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

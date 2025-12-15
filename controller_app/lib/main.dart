import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:gun_controller/controller_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Force Landscape
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  // Fullscreen
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gun Controller',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF121212),
        colorScheme: const ColorScheme.dark(
          primary: Colors.cyanAccent,
          secondary: Colors.redAccent,
        ),
      ),
      home: const ControllerScreen(),
    );
  }
}

# Changelog

All notable changes to Better Fabric Console will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-05-24

### Added
- Initial release of Better Fabric Console
- Embedded Netty HTTP and WebSocket server hosted directly by the Minecraft server
- Real-time console log streaming via Log4j2 appender
- Optional Spark integration for TPS, CPU and JVM memory metrics
- SHA-256 master password authentication with first-run setup wizard
- UUID session token validation for all REST endpoints and WebSocket connections
- Customizable Quick Actions grid with confirmation dialogs for destructive commands
- Server-side regex filter rules (include, exclude, color-highlight) for console logs
- Plugin system to toggle Spark and console capture independently at runtime
- React + Vite single-page web UI with glassmorphism dark theme
- Unified Gradle build task that compiles the frontend and packages the final jar
- GPL-3.0 / MIT dual license with parent attribution

# Better Fabric Console

A modern, server-side Fabric mod for Minecraft 26.1.2 that hosts a local web-based administration interface directly from the Minecraft server itself. The mod serves as a runtime bridge, exposing metrics, console captures, and customizable controls without relying on external dashboard servers.

---

## Key Features

- **Co-Located Web Server**: Hosted directly by the Minecraft server runtime on port `8000` (customizable) using a lightweight Netty HTTP and WebSocket stack.
- **Modern Dark UI**: A responsive web interface styled with glassmorphism aesthetics, dynamic micro-animations, and CSS layout grids.
- **Master Password Security**: Secured with local SHA-256 password hashing. Includes a first-run setup wizard, a login screen, and UUID session token validation guarding all REST endpoints and WebSocket connections.
- **Quick Admin Controls**: A grid of customizable buttons to execute standard or custom admin commands (e.g., Save World, Stop Server, Clear Weather, Player List) with built-in confirmation dialogues for destructive actions.
- **Optional Spark Integration**: Automatically queries the Spark mod if present on the server to stream real-time metrics (TPS, process/system CPU usage, and JVM memory allocation). Gracefully displays alternatives if Spark is disabled or uninstalled.
- **Regex Log Filters**: Client-side interactive logs with configurable server-side regex filter rules supporting matching criteria to exclude, include, or color-highlight terminal lines.
- **Zero bloat**: Spark APIs are referenced as a `compileOnly` dependency at build time, ensuring no external mod classes are bundled in the final companion jar.

---

## Directory & File Structure

The project integrates the backend mod and frontend webapp into a unified source tree:
- **`src/main/java/...`**: Java source files including the Netty server, `AuthManager`, and JSON `Storage` wrapper.
- **`service/client/`**: React Vite web project compiling into single-page application bundle.
- **`src/main/resources/web/`**: Location where compiled frontend production assets are bundled during packaging.
- **`libs/`**: Local cache directory storing compile-time dependencies.

---

## Configuration

On first run, the mod generates a config folder under:
📂 `config/better_fabric_console/`

Inside `config.json`, the following configuration parameters are managed:
```json
{
  "serverName": "Minecraft Server Mod",
  "hostPort": 8000,
  "masterPasswordHash": "sha256_hash_here",
  "sessionTimeoutMinutes": 1440,
  "plugins": {
    "sparkEnabled": true,
    "consoleEnabled": true,
    "sparkInstalled": true
  },
  "filters": [],
  "quickActions": [
    {
      "id": "1",
      "name": "Save World",
      "command": "save-all",
      "color": "#10b981",
      "icon": "Save"
    }
  ]
}
```

---

## Compilation & Installation

### Requirements
- **Java Development Kit (JDK)**: Version 25
- **Node.js & npm**: For compiling the React application

### Build Procedure
Run the standard gradle wrapper build task:
```bash
./gradlew build
```
This task automatically:
1. Navigates to `/service/client` and triggers `npm run build`
2. Copies the compiled production assets (`index.html`, javascript/css bundles) to Java resources (`/web`)
3. Compiles the Fabric mod classes
4. Packages a single, unified jar file under `build/libs/better-fabric-console-1.0.0.jar`

### Deployment
To install, copy the generated `.jar` file to your server mods directory:
```bash
cp build/libs/better-fabric-console-1.0.0.jar /path/to/your/minecraft/server/mods/
```

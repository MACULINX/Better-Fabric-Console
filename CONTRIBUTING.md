# Contributing to Better Fabric Console

Thank you for your interest in contributing! This project is maintained in free time, so every contribution — big or small — is genuinely appreciated. 🙌

---

## 🛠️ How to Contribute

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/better_fabric_console.git
cd better_fabric_console
```

### 2. Create a Branch
Use a descriptive branch name:
```bash
git checkout -b feat/bluemap-integration
git checkout -b fix/websocket-disconnect
git checkout -b docs/update-readme
```

### 3. Build the Project
Make sure you have **JDK 25** and **Node.js 20+** installed, then:
```bash
./gradlew build
```
This compiles the React frontend and packages the final jar automatically.

### 4. Make Your Changes
- Keep changes focused — one feature or fix per PR
- Follow the existing code style
- Test your changes on a real Fabric server before submitting

### 5. Submit a Pull Request
- Target the `main` branch
- Fill in the PR template completely
- Link any related issues using `Closes #123`

---

## 💬 Suggesting Features or Integrations

Have a mod you'd like to see integrated? Open a [GitHub Discussion](https://github.com/MACULINX/better_fabric_console/discussions) or use the [Feature Request](https://github.com/MACULINX/better_fabric_console/issues/new?template=feature_request.md) issue template.

---

## 📜 License

By contributing to this project you agree that your contributions will be licensed under the same dual license as the project:
- **`/src`** (Fabric Mod): GPL-3.0 with Parent Attribution
- **`/service`** (Web Service & Frontend): MIT with Parent Attribution

See [LICENSE](LICENSE) for details.

# Security Policy

## 🔒 Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | ✅ Yes |

---

## 🚨 Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

This project exposes a web server with authentication on the local network. If you discover a security vulnerability — such as authentication bypass, session token leakage, command injection, or path traversal — please report it privately.

### How to report

1. Go to the [Security Advisories](https://github.com/MACULINX/better_fabric_console/security/advisories/new) page
2. Click **"Report a vulnerability"**
3. Describe the issue with as much detail as possible:
   - Steps to reproduce
   - Potential impact
   - Suggested fix (optional)

You will receive a response within **72 hours**. Confirmed vulnerabilities will be patched and disclosed publicly after a fix is released.

---

## 🛡️ Security Notes

- The web interface is designed for **local network use only** — do not expose port `8000` to the public internet without a reverse proxy and TLS.
- Passwords are stored as **SHA-256 hashes** — never store plain text credentials in `config.json`.
- Session tokens are **UUID-based** and validated on every request.

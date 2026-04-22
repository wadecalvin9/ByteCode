# ⚡ ByteCode Tactical C2

**ByteCode** is a modern, unified Command and Control (C2) framework designed for tactical infrastructure monitoring and security audit exercises. It features a high-fidelity React dashboard, a robust Node.js backend, and a portable CLI for instant deployment.

---

## 🚀 Instant Deployment

Install the system globally via npm:

```bash
npm install -g bytecode-c2
```

Start the tactical hub:

```bash
bytecode start
```

Your dashboard will be available at **http://localhost:3001**.

---

## ✨ Features

- **Unified Infrastructure**: A single command spins up both the API and the Management Console.
- **Glitch-Tech Dashboard**: Premium, high-density interface for real-time asset intelligence.
- **Tactical Console**: Interactive terminal experience with persistent session clearing and smart history.
- **Persistent Operations**: Built-in modules for Windows registry persistence and automated agent purging (self-destruct).
- **Auto-Seeding**: Automatic initialization with secure default credentials on first run.

---

## 🔐 Default Credentials

Access the dashboard using the following operator credentials:

- **Username**: `admin`
- **Password**: `bytecode`

---

## 🏗️ Architecture

- **Control Hub**: Node.js backend serving as the central intelligence and routing engine.
- **Tactical Console**: React-based SPA served directly by the hub for zero-latency operations.
- **ByteCode Agent**: Multi-platform Go agent (source included in the package for compilation).

---

## 🛡️ Disclaimer

ByteCode is intended for authorized security auditing, infrastructure monitoring, and educational purposes only. Unauthorized use on systems you do not own or have explicit permission to test is strictly prohibited.

---



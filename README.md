# 🛡️ ByteCode Enterprise C2

**ByteCode** is a professional, high-fidelity Command and Control (C2) infrastructure designed for advanced security auditing, infrastructure monitoring, and defensive posture validation. It features a sophisticated React-based management console, a robust Node.js orchestration engine, and cross-platform Go agents.

---

---

## 🛠️ System Requirements

Before deploying the ByteCode infrastructure, ensure your host environment meets the following requirements:

- **Node.js**: version 18.0.0 or higher.
- **Go (Golang)**: version 1.20 or higher (Required for cross-compiling agents).
- **Architecture**: Linux, macOS, or Windows (WSL recommended for Linux builds).
- **Disk Space**: ~500MB for full infrastructure and dependencies.

---

## 📦 Installation

### Global Installation (Recommended)

Install the ByteCode Enterprise suite globally via npm to access the `bytecode` CLI from anywhere:

```bash
# Install the suite globally
npm install -g bytecode-c2

# Launch the orchestration hub
bytecode start
```

### Local Development Setup

For operators wishing to modify the source or run in a localized environment:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-repo/bytecode.git
   cd bytecode
   ```

2. **Install All Dependencies**:
   The root package includes a helper script to install dependencies across the server and dashboard modules:
   ```bash
   npm run install-all
   ```

3. **Build the Management Console**:
   ```bash
   npm run build
   ```

4. **Start the Hub**:
   ```bash
   npm start
   ```

---

## ✨ Core Infrastructure Features

- **Fleet Intelligence & Inventory**: A high-density dashboard providing a unified overview of all infrastructure endpoints with real-time connectivity telemetry.
- **Advanced Endpoint Auditing**: Integrated detail center for deep asset inspection, including process mapping, file system exfiltration, and network monitoring.
- **Cross-Platform Payload Builder**: Automated, cross-compilation engine for generating secure Go-based beacons tailored for Windows and Linux environments.
- **Malleable Transport Profiles**: Fine-grained control over temporal signatures (jitter/intervals) and transport layer masquerading (custom headers/User-Agent).
- **Network Topology Mapping**: Real-time visualization of infrastructure relationships and data propagation paths.
- **Secure Operational Gateway**: Professional-grade authentication gateway and centralized data explorer for operational intelligence.

---

## 🔐 Default Access

The orchestration hub initializes with the following default operator credentials:

- **Username**: `admin`
- **Password**: `bytecode`

---

## 🏗️ Technical Architecture

- **Management Console**: High-performance React SPA designed for operational density and real-time visualization.
- **Orchestration Hub**: Node.js backend providing secure API routing, task scheduling, and data persistence.
- **Core Agents**: High-performance Go-based beacons designed for portability and minimal footprint.

---

## 🛡️ Operational Ethics

ByteCode is intended exclusively for authorized security auditing, infrastructure monitoring, and educational purposes. Unauthorized use on systems without explicit owner permission is strictly prohibited.

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



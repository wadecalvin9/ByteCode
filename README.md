# 🏴‍☠️ ByteCode C2
**Professional-Grade Tactical Command & Control Infrastructure**

ByteCode is a premium C2 framework engineered for high-fidelity post-exploitation, advanced evasion, and infrastructure resilience. 

![Version](https://img.shields.io/badge/Version-1.5.0--Stable-blueviolet?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-success?style=for-the-badge)
![Evasion](https://img.shields.io/badge/Evasion-Hell's_Gate-orange?style=for-the-badge)

---

## ⚡ Core Tactical Features

### 🛡️ Advanced Evasion & OpSec
*   **Indirect Syscalls (Hell's Gate)**: Bypasses EDR/AV hooks by dynamically extracting SSNs and executing syscalls directly via assembly stubs.
*   **Memory Masking**: XOR-based encryption of agent configuration and memory cloaking during sleep periods.
*   **AES-256-GCM Transport**: Cryptographically secured C2 channel using a 32-byte Pre-Shared Key (PSK).
*   **Panic Recovery**: Hardened agent executor with runtime recovery to prevent disconnections during failed tactical operations.

### 🛰️ Post-Exploitation Primitives
*   **In-Memory BOF Loader**: Reflective COFF loader capable of executing Cobalt Strike compatible Beacon Object Files (BOFs) in-process without touching disk.
*   **Identity Management**: Native token impersonation (`impersonate`) and privilege auditing (`getprivs`) for rapid lateral movement.
*   **Ghost Injection**: Process injection using stealthy memory allocation and thread creation via indirect syscalls.
*   **Tactical Console**: Integrated dashboard terminal that maps console commands to native agent primitives.

### 🌐 Infrastructure Resilience
*   **Multi-Host Failover**: Agents support a server pool for automatic rotation and failover if the primary C2 is neutralized.
*   **Infrastructure Monitor**: Real-time dashboard view of server health and agent connectivity across the failover pool.

---

## 🏗️ Infrastructure Setup

### 📦 Redis Dependencies
ByteCode utilizes Redis for high-speed task caching and real-time WebSocket state management.

#### Option A: Docker (Recommended)
The easiest way to setup the infrastructure is via Docker Compose:
```bash
docker-compose up -d redis
```

#### Option B: Manual Installation (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

#### Option C: Windows
1. Download the latest `.msi` from [Redis for Windows](https://github.com/microsoftarchive/redis/releases).
2. Install and ensure the service is running on `localhost:6379`.

---

## 🚀 Quick Start

### 1. Launch the Hub
```bash
# Install dependencies
npm install

# Start the C2 system (Auto-detects Redis)
npm start
```

### 2. Build the Agent
Generate a hardened agent via the **Payload Builder** in the dashboard, or build manually:
```bash
cd agent
# Build for Windows x64 with Evasion
go build -ldflags="-s -w -H=windowsgui" -o agent.exe ./cmd/agent
```

### 3. Deploy
Execute `agent.exe` on the target. The agent will beacon to the configured pool and appear in the **Infrastructure Monitor**.

---

## 🗺️ Roadmap

- [x] **Phase 1**: AES Encryption, Jitter, Dockerization, Redis.
- [x] **Phase 2**: Hell's Gate, Memory Masking, Ghost Injection.
- [x] **Phase 3**: In-memory BOF Loader, Token Impersonation, Multi-host Failover.
- [ ] **Phase 4**: SOCKS5 Proxying, UDRL Integration, Kernel-Mode Persistence.

---

## ⚠️ Disclaimer
*This tool is intended for authorized security auditing and educational purposes only. Unauthorized use on systems you do not own is strictly prohibited.*

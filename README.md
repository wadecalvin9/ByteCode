# 🏴‍☠️ ByteCode C2

**ByteCode** is a premium, tactical Command & Control (C2) infrastructure designed for high-performance post-exploitation and evasion testing. 

![ByteCode Dashboard](https://img.shields.io/badge/Version-1.2.0--Alpha-blueviolet?style=for-the-badge)
![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-success?style=for-the-badge)
![Evasion](https://img.shields.io/badge/Evasion-Hell's_Gate-orange?style=for-the-badge)

---

## ⚡ Core Features

### 🛡️ Operational Security (OpSec)
*   **AES-256-GCM Encryption**: All beacon and result traffic is cryptographically secured with a 32-byte Pre-Shared Key (PSK).
*   **Memory Masking**: The agent automatically encrypts its sensitive configuration (URLs, keys) and cloaks its memory sections during sleep periods.
*   **Indirect Syscalls (Hell's Gate)**: Bypasses EDR hooks by dynamically extracting System Service Numbers (SSNs) from `ntdll.dll` and executing syscalls directly via assembly.
*   **Adaptive Jitter**: Randomized callback intervals to defeat pattern-based network detection.

### 🛰️ Advanced Capabilities
*   **Ghost Injection**: Stealthy process injection using `NtAllocateVirtualMemory` and `NtCreateThreadEx` via indirect syscalls.
*   **Real-time Tasking**: High-speed WebSocket channel for sub-second task execution with HTTP/S fallback.
*   **Cross-Platform Agent**: Single Go codebase with platform-specific logic for Windows, Linux, and macOS.
*   **Automated Payload Builder**: Integrated dashboard feature for generating custom, pre-configured agents.

---

## 🏗️ Infrastructure Setup

### 🐳 Docker Deployment (Recommended)
The entire stack is containerized for professional deployment.

```bash
# Clone the repository
git clone https://github.com/wadecalvin9/ByteCode.git
cd ByteCode

# Launch the infrastructure
docker-compose up --build
```
*Access the dashboard at `http://localhost:3001`*

### 💻 Local Development
If you prefer running without Docker:

```bash
# Install dependencies
npm install

# Start the C2 system
bytecode start
```

---

## 🤖 Agent Deployment

### Building the Agent
You can generate agents via the **Payload Builder** in the dashboard, or build manually:

```bash
cd agent
# For Windows (with stealth features)
go build -o agent.exe ./cmd/agent
```

### Configuration
The agent is configured via environment variables or build-time `-ldflags`:
*   `BYTECODE_SERVER`: The C2 server URL.
*   `BYTECODE_PSK`: The 32-byte AES key (must match server).

---

## 🗺️ Roadmap

- [x] **Phase 1**: AES Encryption, Jitter, Dockerization, Redis.
- [x] **Phase 2**: Hell's Gate, Memory Masking, Ghost Injection, Task ID Logging.
- [ ] **Phase 3**: Beacon Object File (BOF) support, SOCKS5 Proxying, UDRL Integration.

---

## ⚠️ Disclaimer
*This tool is intended for authorized security auditing and educational purposes only. Unauthorized use on systems you do not own is strictly prohibited.*

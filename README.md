# ByteCode C2
### Strategic Command & Control Infrastructure for Advanced Security Operations

![Banner](assets/bytecode_c2_banner.png)

[![Release](https://img.shields.io/badge/Release-v1.5.0--STABLE-blue.svg?style=flat-square)](#)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=flat-square)](#)
[![Architecture](https://img.shields.io/badge/Arch-Windows_/_Linux-lightgrey.svg?style=flat-square)](#)
[![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-success.svg?style=flat-square)](#)

ByteCode is a high-performance C2 framework engineered for advanced red-teaming, post-exploitation, and infrastructure resilience. It provides operators with a sophisticated suite of tactical primitives designed for stealthy operation in highly-monitored environments.

---

## Technical Specifications

### Tactical Evasion & Stealth
*   **Dynamic Syscall Invocation**: Implements Hell's Gate/Halo's Gate techniques to bypass EDR/AV hooks by dynamically extracting SSNs and executing syscalls via assembly stubs.
*   **Cryptographic Transport Layer**: All C2 traffic is secured using AES-256-GCM with a build-time injected Pre-Shared Key (PSK).
*   **Memory Obfuscation**: Agent configuration and state are masked using XOR-based encryption during sleep cycles to minimize memory forensics signatures.
*   **Ghost Injection**: Supports stealthy process injection using indirect syscalls for memory allocation and thread creation.

### Operational Primitives
*   **In-Memory Artifact Execution**: Reflective COFF loader for executing Beacon Object Files (BOFs) directly in memory without disk artifacts.
*   **Privilege & Identity Management**: Native support for token impersonation, privilege auditing, and credential vault discovery.
*   **Artifact Factory**: Integrated build pipeline for generating hardened, customized agent binaries with build-time configuration injection.
*   **Data Explorer**: Centralized repository for exfiltrated assets, featuring integrity-validated download protocols.

### Infrastructure Resilience
*   **C2 Pool Failover**: Supports multi-host infrastructure pools with automatic agent failover and rotation.
*   **Real-time Telemetry**: WebSocket-driven dashboard providing sub-second latency for command execution and infrastructure status monitoring.
*   **Persistent Intelligence**: SQLite-backed logging ensuring operational history and agent states are preserved across server reboots.

---

## Infrastructure Deployment

### Redis Dependency
ByteCode utilizes Redis for high-speed task scheduling and real-time state synchronization.

#### Deployment via Docker (Recommended)
```bash
docker-compose up -d redis
```

#### Manual Installation (Linux)
```bash
sudo apt update && sudo apt install redis-server -y
sudo systemctl enable --now redis-server
```

---

## Operational Workflow

### 1. Hub Initialization
Initialize the C2 server and operator dashboard:
```bash
# Provision dependencies
npm install

# Initialize the ByteCode environment
npm start
```

### 2. Artifact Generation
Generate a tactical agent via the **Artifact Factory** in the dashboard.
*   **Agent Identity**: Customize binary naming (e.g., `svchost.exe`) for environmental blending.
*   **C2 Pool**: Configure primary and failover infrastructure nodes.
*   **Jitter/Interval**: Define beaconing patterns to bypass heuristic analysis.

### 3. Tactical Deployment
Deploy the generated binary on the target environment. The agent will automatically initialize the beaconing protocol and appear in the **Infrastructure Monitor**.

---

## Security & Access Control

### Operational Integrity
*   **Default Credentials**: The initial system deployment utilizes `admin` / `bytecode`. 
*   **Credential Rotation**: Operators must rotate passwords via the **Settings** panel immediately upon deployment.
*   **Persistence**: Operational data is stored in `./data/bytecode.db`. This database preserves all historical exfiltration and tasking; it is **never** overwritten during system restarts.

---

## Developmental Roadmap

- [x] **Milestone 1**: AES-GCM Transport, Multi-host Failover, Redis Integration.
- [x] **Milestone 2**: Hell's Gate Syscall Implementation, Memory Masking.
- [x] **Milestone 3**: Reflective BOF Loader, Artifact Factory, Terminal Clear Primitives.
- [ ] **Milestone 4**: SOCKS5 Tunneling, UDRL Integration, Kernel-Mode Persistence.

---

## Legal Disclaimer
*This framework is designed for authorized professional security auditing and educational purposes only. Unauthorized use on systems without explicit prior consent is strictly prohibited and may be illegal.*

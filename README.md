# ⚡ ByteCode Distributed C2

ByteCode is a modern, distributed Command and Control (C2) framework designed for internal infrastructure monitoring and red teaming exercises. It features a lightweight Go-based agent, a high-performance Node.js backend, and a premium React-based management dashboard.

---

## 🏗️ Architecture

- **Control Server (Node.js/Express)**: The central brain that handles agent registration, task queuing, and data persistence using SQLite.
- **Operator Dashboard (React/Vite)**: A sleek, real-time interface for monitoring agents, executing commands, and generating payloads.
- **ByteCode Agent (Go)**: A multi-platform agent designed for stealth and low resource consumption. Features beaconing logic and customizable sleep intervals.

---

## ✨ Key Features

- **Payload Generator**: Compile custom agents directly from the dashboard with embedded C2 configurations.
- **Real-time Console**: Interactive terminal-like experience for tasking agents and viewing output.
- **Secure Beaconing**: Agents check in via encrypted-ready HTTP heartbeats with customizable jitter.
- **Task Management**: Queue system-level commands and track execution history.
- **System Metadata**: Automatically gathers OS info, architecture, PID, and internal network details.

---

## 🚀 Quick Start

### 1. Server Setup
```bash
cd server
npm install
npm run seed  # Creates default operator: admin/bytecode
npm run dev   # Server runs on port 3001
```

### 2. Dashboard Setup
```bash
cd dashboard
npm install
npm run dev   # Usually http://localhost:5173
```

### 3. Deploying Agents
- Log in to the dashboard.
- Navigate to the **Payloads** tab.
- Enter your Server IP and click **Generate**.
- Download the `.exe` and run it on the target machine.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express, Better-SQLite3, JWT Auth
- **Agent**: Go 1.22+

---

## 🛡️ Disclaimer
This tool is for educational purposes and authorized security testing only. Use it responsibly and always with permission from the system owner.

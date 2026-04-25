# Security Policy

## Supported Versions

ByteCode C2 is under active development. Security updates are provided only for the latest stable release.

| Version | Support Status |
|---------|----------------|
| Latest (main branch) | ✅ Actively supported |
| All previous versions | ❌ Not supported (upgrade required) |

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, email **wadecalvin9@gmail.com** with:

- **Subject prefix:** `[SECURITY]` 
- **Description:** What the vulnerability allows (RCE, privilege escalation, etc.)
- **Reproduction steps:** Commands, code, or configuration to trigger the issue
- **Affected component:** Agent (Go), Server (Node.js), Dashboard (React), or Build process
- **Proposed fix:** If you have one (optional)

### What to Expect

| Timeframe | Action |
|-----------|--------|
| **24 hours** | Acknowledgment of receipt |
| **72 hours** | Initial assessment (Severity: Critical/High/Medium/Low) |
| **7-14 days** | Fix developed and tested |
| **14-21 days** | Patch released + advisory published |

### Severity Guidelines

| Severity | Description | Example |
|----------|-------------|---------|
| **Critical** | RCE on C2 server, agent takeover | Remote code execution via task response |
| **High** | Data leak, authentication bypass | JWT secret exposure, SQL injection |
| **Medium** | Information disclosure, DoS | Stack trace in error message |
| **Low** | Best practice violation | Weak default config |

### Disclosure Policy

- **Private disclosure period:** 14 days after fix confirmation (no public info)
- **Coordinated release:** Patch + advisory published simultaneously
- **Credit:** We will acknowledge you in the advisory unless you request anonymity

### What We Will Not Accept

- Vulnerabilities requiring physical access
- Social engineering attacks
- Third-party dependency vulnerabilities (report upstream instead)
- Theoretical issues without proof-of-concept

## Secure Development Practices

ByteCode follows these security practices:

1. **Static Analysis:** `gosec` for Go agent, `npm audit` for Node.js
2. **Dependency Scanning:** Automated weekly (Dependabot)
3. **No Hardcoded Secrets:** All keys/config via environment or config file
4. **Memory Safety:** Go's built-in bounds checking + safe syscall patterns

## Bug Bounty

We currently do not operate a bug bounty program. Vulnerability reports are accepted on a best-effort basis with credit as recognition.

---

**Contact:** wadecalvin9@gmail.com 

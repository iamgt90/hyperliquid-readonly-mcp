# Security Policy

## Reporting a Vulnerability

If you discover a security issue, please open a GitHub security advisory or contact the maintainer through GitHub.

Please avoid publicly disclosing vulnerabilities before they are reviewed.

---

## Scope

This project is intentionally read-only.

It does not:

- place trades
- sign transactions
- access wallets
- handle private keys
- handle seed phrases
- move funds
- modify positions
- change leverage

Only public Hyperliquid API endpoints are used.

---

## Best Practices

Never commit:

- API keys
- private keys
- seed phrases
- wallet credentials
- `.env` files
- authentication tokens

Use local-only configuration files and environment variables for sensitive information.

---

## Dependency Security

This repository uses:

- Dependabot alerts
- Dependabot security updates
- GitHub secret scanning
- Push protection

to help reduce accidental exposure of sensitive information and vulnerable dependencies.

---

## Supported Versions

This project is currently maintained on a best-effort basis.

Security fixes, dependency updates, and repository hardening may be applied without guaranteed release schedules.

---

## Disclaimer

This repository is provided for educational, informational, and research purposes only.

It does not provide financial advice or automated trading functionality.

Users remain solely responsible for their own operational security and trading decisions.

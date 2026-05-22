# Hyperliquid Readonly MCP

If you found this project through GitHub, Claude Code, or an MCP workflow — welcome.

Hyperliquid Readonly MCP is a read-only Model Context Protocol (MCP) server for Hyperliquid perpetual markets. It allows Claude and other MCP-compatible AI clients to inspect market conditions, public wallet state, funding, open interest, liquidation exposure, and perp metadata in real time.

This project is designed for:
- market research
- position monitoring
- risk analysis
- funding analysis
- manual discretionary workflows
- AI-assisted market interpretation

It is **not** an execution engine.

---

# Warning

Not affiliated with Hyperliquid, Anthropic, or any exchange operator.

This project uses Hyperliquid public API endpoints only. Review the Disclaimer section before use.

---

# Important

This MCP server is read-only by design.

It cannot:
- place trades
- cancel orders
- modify positions
- sign transactions
- access private keys
- access exchange accounts
- execute strategies automatically

No wallet authentication is required.

---

# Note

All analysis happens locally through your MCP client and the public Hyperliquid API.

No browser automation.
No wallet signing.
No private key handling.
No custodial functionality.

---

# What This MCP Does

Feature | Description
--- | ---
Market price lookup | Read current perp mark prices
Asset context | Funding, OI, premium, impact prices, volume
Wallet inspection | Read public wallet positions and balances
Open orders | Inspect public open orders
Risk analysis | Evaluate liquidation distance and leverage exposure
Funding analysis | Monitor perp funding conditions
Market search | Search perp markets across venues
Claude integration | Use MCP tools directly inside Claude Code
Read-only architecture | No execution capability

---

# One-Shot Setup

Paste this into Claude Code:

```text
Set up Hyperliquid Readonly MCP for me.

Clone https://github.com/YOUR_USERNAME/hyperliquid-readonly-mcp.git to ~/hyperliquid-readonly-mcp, run npm install, then add it to my MCP config at ~/.claude/.mcp.json.

The config block is:

{
  "mcpServers": {
    "hyperliquid-readonly": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/hyperliquid-readonly-mcp/dist/server.js"]
    }
  }
}

Replace YOUR_USERNAME with my actual username.

Then run npm run build.
Finally restart Claude Code and verify using hl_health_check.
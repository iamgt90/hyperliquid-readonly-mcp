# Hyperliquid Readonly MCP

Hyperliquid Readonly MCP is a Read-only by design Model Context Protocol (MCP) server for Hyperliquid perpetual markets.

It allows Claude and other MCP-compatible AI clients to inspect:

- market prices
- funding rates
- open interest
- public wallet positions
- open orders
- liquidation distance
- leverage exposure
- market context
- volatility conditions

This project is designed for research, monitoring, discretionary trading workflows, and AI-assisted market analysis.

It is not a trading bot.

---

## Warning

Not affiliated with Hyperliquid, Anthropic, Claude, or any exchange operator.

This project uses Hyperliquid public API endpoints only.

---

## Important

This MCP server is intentionally read-only.

It cannot:

- place trades
- cancel orders
- modify positions
- close positions
- sign transactions
- access private keys
- access seed phrases
- move funds
- change leverage

Only public wallet addresses are used.

---

## Features

| Feature | Description |
|---|---|
| `hl_health_check` | Verify Hyperliquid API connectivity |
| `hl_get_market_price` | Read current mark/mid price |
| `hl_search_markets` | Search markets by ticker or keyword |
| `hl_get_asset_context` | Funding, OI, premium, volume, impact prices |
| `hl_get_position_summary` | Read public wallet perpetual positions |
| `hl_get_open_orders` | Read public open orders |
| `hl_analyze_position_context` | Combined risk and market snapshot |

---

## Quick Start

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/hyperliquid-readonly-mcp.git
cd hyperliquid-readonly-mcp
```

Install dependencies:

```bash
npm install
```

Build the project:

```bash
npm run build
```

Register the MCP server:

```bash
claude mcp add hyperliquid-readonly -- node /Users/YOUR_MAC_USERNAME/hyperliquid-readonly-mcp/dist/server.js
```

Verify registration:

```bash
claude mcp list
```

Expected output:

```text
hyperliquid-readonly ... Connected
```

Restart Claude Code and ask:

```text
Use hl_health_check
```

---

## One-Shot Claude Setup

Paste this into Claude Code:

```text
Set up Hyperliquid Readonly MCP for me.

Clone the repository.

Run:
- npm install
- npm run build

Then register the MCP server using:

claude mcp add hyperliquid-readonly -- node /FULL/PATH/TO/hyperliquid-readonly-mcp/dist/server.js

Finally restart Claude Code and verify using:
Use hl_health_check
```

---

## Wallet Usage

This MCP never connects to wallets directly.

It only reads public wallet state using a public wallet address.

Example wallet format:

```text
0x0000000000000000000000000000000000000000
```

Never enter:

- private keys
- seed phrases
- API private keys

### Read wallet positions

```text
Use hl_get_position_summary with wallet address 0xYOUR_PUBLIC_WALLET_ADDRESS.
```

### Read open orders

```text
Use hl_get_open_orders with wallet address 0xYOUR_PUBLIC_WALLET_ADDRESS.
```

---

## Market Usage

### Read market price

```text
Use hl_get_market_price with coin BTC.
```

### Read funding and market context

```text
Use hl_get_asset_context with coin BTC.
```

### Search markets

```text
Use hl_search_markets with query BTC.
```

---

## External DEX Markets

Some markets exist under external DEX namespaces.

Use either split format:

```text
Use hl_get_market_price with coin COIN and dex DEX_NAME.
```

or prefixed format:

```text
Use hl_get_market_price with coin DEX_NAME:COIN.
```

---

## Example Claude Workflows

### Position Risk Analysis

```text
Analyze my current exposure using wallet 0xYOUR_PUBLIC_WALLET_ADDRESS.

Focus on:
- leverage
- liquidation distance
- unrealized pnl
- margin usage
- funding pressure
- directional exposure
- volatility risk

Do not suggest execution.
```

### Market Structure Analysis

```text
Analyze current market conditions for BTC.

Focus on:
- funding
- open interest
- volatility
- directional bias
- premium
- liquidity conditions

Do not suggest execution.
```

### Compare Multiple Markets

```text
Compare BTC, ETH, and SOL perpetual conditions.

Focus on:
- funding divergence
- open interest
- relative strength
- volatility
- liquidity
```

---

## Example Output

```text
BTC | POSITION: Long | LEVERAGE: 5x isolated

Mark price: 000.00
Entry price: 000.00
Liquidation price: 000.00
Unrealized PnL: +0.00
Funding: mildly positive
Open interest: expanding
24h volume: moderate

Risk summary:
The position remains exposed to short-term volatility spikes.
```

---

## Tool Reference

### Health

| Tool | Description |
|---|---|
| `hl_health_check` | Confirms API connectivity |

### Market Data

| Tool | Description |
|---|---|
| `hl_get_market_price` | Read current market price |
| `hl_search_markets` | Search available markets |
| `hl_get_asset_context` | Funding, OI, premium, volume, impact prices |

### Wallet Data

| Tool | Description |
|---|---|
| `hl_get_position_summary` | Read public wallet position state |
| `hl_get_open_orders` | Read public open orders |
| `hl_analyze_position_context` | Combined wallet + market risk analysis |

---

## Architecture

```text
Claude Code
   ↓
MCP Server over stdio
   ↓
Hyperliquid public API
   ↓
Market data and public wallet state
```

No private key layer exists.

No execution layer exists.

No browser automation exists.

---

## Read-Only Security Model

This project intentionally excludes:

- order placement
- order cancellation
- leverage changes
- wallet signing
- private key handling
- automated execution

If execution tooling is ever added, it should exist in a separate repository with separate permissions and review processes.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| MCP server not visible | Run `claude mcp list` |
| Build fails | Run `npm install` again |
| Coin not found | Use `hl_search_markets` |
| Wallet shows empty positions | Wallet may not have active positions |
| Claude cannot call tools | Restart Claude Code |
| DEX market missing | Use the `dex` parameter |

---

## Roadmap

Possible future features:

- multi-wallet monitoring
- historical funding snapshots
- volatility regime summaries
- liquidation distance alerts
- market scanner mode
- JSON export
- CLI wrapper
- read-only dashboard

---

## Disclaimer

This project is provided for educational, research, and informational purposes only.

It does not provide financial advice.

It does not execute trades.

Users are solely responsible for:

- risk management
- legal compliance
- tax obligations
- operational security
- trading decisions

Use at your own risk.

---

## License

MIT License.

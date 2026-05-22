# Hyperliquid Readonly MCP

Hyperliquid Readonly MCP is a read-only Model Context Protocol (MCP) server for Hyperliquid perpetual markets.

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

This project is designed for:

- market research
- discretionary trading workflows
- risk monitoring
- AI-assisted market analysis
- position review
- funding analysis

It is not a trading bot.

---

# Warning

Not affiliated with Hyperliquid, Anthropic, Claude, or any exchange operator.

This project uses Hyperliquid public API endpoints only.

Review the Disclaimer section before use.

---

# Important

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
- interact with wallets directly

Only public wallet addresses are used.

---

# Note

All requests are made against public Hyperliquid API endpoints.

No browser automation is used.

No wallet connection is required.

No private key is required.

No API key is required.

---

# Features

| Feature | Description |
|---|---|
| hl_health_check | Verify Hyperliquid API connectivity |
| hl_get_market_price | Read current mark/mid price |
| hl_search_markets | Search markets by ticker or keyword |
| hl_get_asset_context | Funding, OI, premium, volume, impact prices |
| hl_get_position_summary | Read public wallet perpetual positions |
| hl_get_open_orders | Read public open orders |
| hl_analyze_position_context | Combined risk and market snapshot |

---

# One-Shot Claude Setup

Paste this into Claude Code:

text Set up Hyperliquid Readonly MCP for me.  Clone the repository.  Run: - npm install - npm run build  Then register the MCP server using:  claude mcp add hyperliquid-readonly -- node /FULL/PATH/TO/hyperliquid-readonly-mcp/dist/server.js  Finally restart Claude Code and verify using: Use hl_health_check 

---

# Prerequisites

- Node.js 18+
- Claude Code or another MCP-compatible client
- Internet connection
- Public Hyperliquid wallet address (optional)

---

# Full Setup Walkthrough

## 1. Clone the repository

bash git clone https://github.com/YOUR_USERNAME/hyperliquid-readonly-mcp.git cd hyperliquid-readonly-mcp 

---

## 2. Install dependencies

bash npm install 

---

## 3. Build the MCP server

bash npm run build 

---

## 4. Register the MCP server

Example:

bash claude mcp add hyperliquid-readonly -- node /Users/YOUR_MAC_USERNAME/hyperliquid-readonly-mcp/dist/server.js 

---

## 5. Verify registration

bash claude mcp list 

Expected output:

text hyperliquid-readonly ... Connected 

---

## 6. Restart Claude Code

After restarting Claude Code, ask:

text Use hl_health_check 

---

# How to Connect a Wallet

This MCP never connects to wallets directly.

It only reads public wallet state using a public wallet address.

Example wallet format:

text 0x0000000000000000000000000000000000000000 

Never enter:

- private keys
- seed phrases
- API private keys

---

## Example Wallet Usage

text Use hl_get_position_summary with wallet address 0xYOUR_PUBLIC_WALLET_ADDRESS. 

---

# How to Read Open Orders

text Use hl_get_open_orders with wallet address 0xYOUR_PUBLIC_WALLET_ADDRESS. 

Claude will inspect:

- limit orders
- trigger orders
- currently open orders

using public exchange state only.

---

# How to Change Coin / Ticker

Use the coin parameter.

Examples:

text Use hl_get_market_price with coin BTC. 

text Use hl_get_market_price with coin ETH. 

text Use hl_get_market_price with coin SOL. 

---

# How to Use External DEX Markets

Some markets exist under external DEX namespaces.

Use either split format:

text Use hl_get_market_price with coin COIN and dex DEX_NAME. 

or prefixed format:

text Use hl_get_market_price with coin DEX_NAME:COIN. 

Example:

text Use hl_get_asset_context with coin COIN and dex DEX_NAME. 

---

# How to Search Markets

If you do not know the exact ticker:

text Use hl_search_markets with query COIN. 

Example:

text Use hl_search_markets with query BTC. 

For a specific DEX:

text Use hl_search_markets with query COIN and dex DEX_NAME. 

---

# Example Claude Workflows

## Market Analysis

text Analyze current market conditions for BTC.  Focus on: - funding - open interest - volatility - directional bias - premium - liquidity conditions  Do not suggest execution. 

---

## Position Risk Analysis

text Analyze my current exposure using wallet 0xYOUR_PUBLIC_WALLET_ADDRESS.  Focus on: - leverage - liquidation distance - unrealized pnl - margin usage - funding pressure - directional exposure - volatility risk  Do not suggest execution. 

---

## Compare Multiple Markets

text Compare BTC, ETH, and SOL perpetual conditions.  Focus on: - funding divergence - open interest - relative strength - volatility - liquidity 

---

## Open Interest + Funding Workflow

text Analyze current perp positioning for BTC.  Focus on: - funding rate - open interest expansion - crowded positioning - directional imbalance - volatility risk  Do not suggest trades. 

---

## Full Position Context

text Use hl_analyze_position_context with wallet address 0xYOUR_PUBLIC_WALLET_ADDRESS, coin COIN, and dex DEX_NAME. 

This combines:

- current position
- market price
- funding
- open interest
- unrealized pnl
- liquidation distance
- leverage
- volume
- market context

---

# Example Output

text COIN | POSITION: Long | LEVERAGE: 5x isolated  Mark price: 000.00 Entry price: 000.00 Liquidation price: 000.00 Unrealized PnL: +0.00 Funding: mildly positive Open interest: expanding 24h volume: moderate  Risk summary: The position remains exposed to short-term volatility spikes. Funding pressure is currently limited, while liquidation distance remains acceptable for active monitoring. 

---

# How Claude Knows Which Tool to Use

| You say... | Claude should use... |
|---|---|
| “Check if Hyperliquid is connected” | hl_health_check |
| “What is the price of BTC?” | hl_get_market_price |
| “Find this market” | hl_search_markets |
| “Show funding and OI” | hl_get_asset_context |
| “Read my wallet position” | hl_get_position_summary |
| “Show my open orders” | hl_get_open_orders |
| “Analyze my position risk” | hl_analyze_position_context |

---

# Tool Reference

## Health

| Tool | What it does |
|---|---|
| hl_health_check | Confirms API connectivity |

---

## Market Data

| Tool | What it does |
|---|---|
| hl_get_market_price | Reads current market price |
| hl_search_markets | Searches available markets |
| hl_get_asset_context | Reads funding, OI, premium, volume, impact prices |

---

## Wallet / Position Data

| Tool | What it does |
|---|---|
| hl_get_position_summary | Reads public wallet position state |
| hl_get_open_orders | Reads public open orders |
| hl_analyze_position_context | Combines wallet and market data into a risk snapshot |

---

# Architecture

text Claude Code    ↓ MCP Server over stdio    ↓ Hyperliquid public API    ↓ Market data and public wallet state 

No private key layer exists.

No execution layer exists.

No browser control exists.

---

# Read-Only Security Model

This project intentionally excludes:

- order placement
- order cancellation
- position closing
- leverage changes
- wallet signing
- private key handling
- browser automation
- automated execution

If execution tooling is ever added, it should exist in a separate repository with separate permissions and review processes.

---

# Troubleshooting

| Problem | Solution |
|---|---|
| MCP server not visible | Run claude mcp list |
| Build fails | Run npm install again |
| Coin not found | Use hl_search_markets |
| Wallet shows empty positions | Wallet may not have active Hyperliquid positions |
| Claude cannot call tools | Restart Claude Code |
| DEX market missing | Use the dex parameter or prefixed form |

---

# Roadmap

Possible future features:

- multi-wallet monitoring
- historical funding snapshots
- volatility regime summaries
- liquidation distance alerts
- market scanner mode
- JSON export
- position journaling
- CLI wrapper
- risk dashboard
- read-only web UI

---

# Disclaimer

This project is provided for educational, research, and informational purposes only.

It does not provide financial advice.

It does not execute trades.

It does not manage funds.

It does not guarantee profitability.

It does not reduce trading risk.

Users are solely responsible for:

- risk management
- exchange compliance
- legal compliance
- tax obligations
- operational security
- trading decisions

Use at your own risk.

---

# License

MIT License.
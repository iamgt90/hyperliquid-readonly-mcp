# hyperliquid-readonly-mcp

A read-only [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for the [Hyperliquid](https://hyperliquid.DEX_NAME/) perpetuals exchange. It exposes market data, asset context, and public wallet information to any MCP-compatible AI client — including Claude Code, Claude Desktop, and custom agents.

**This server never handles private keys and cannot place, modify, or cancel trades.**

---

## Safety Guarantees

- **No credentials required.** The server calls only Hyperliquid's public `/info` endpoint. No API key, no wallet private key, no signing of any kind.
- **No write operations.** Every tool is explicitly read-only. There is no code path that submits an order, transfers funds, or mutates any on-chain or off-chain state.
- **No secrets in environment.** The only optional environment variable (`HYPERLIQUID_BASE_URL`) overrides the base URL for testing — it is not a credential.
- **Minimal attack surface.** The server accepts only what the MCP client passes via tool arguments, validates inputs with [Zod](https://zod.dev/), and forwards a single POST to the Hyperliquid info API.

---

## Requirements

- Node.js 18+
- npm

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Build

```bash
npm run build
```

This compiles TypeScript to `dist/`.

### 3. Run (development)

```bash
npm run dev
```

### 4. Run (production)

```bash
npm start
```

The server communicates over **stdio** (standard MCP transport) and prints a startup message to stderr.

### Optional: override the API base URL

```bash
HYPERLIQUID_BASE_URL=https://api.hyperliquid-testnet.DEX_NAME npm start
```

---

## Connecting to Claude Code

Add the server to your Claude Code MCP configuration (`.claude/settings.json` or the global settings):

```json
{
  "mcpServers": {
    "hyperliquid-readonly": {
      "command": "node",
      "args": ["/absolute/path/to/hyperliquid-readonly-mcp/dist/server.js"]
    }
  }
}
```

Or for development (using `tsx`):

```json
{
  "mcpServers": {
    "hyperliquid-readonly": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/hyperliquid-readonly-mcp/src/server.ts"]
    }
  }
}
```

---

## Available Tools

| Tool | Description |
|---|---|
| `hl_health_check` | Verify the Hyperliquid public API is reachable |
| `hl_get_all_mids` | Fetch current mid prices for every listed market |
| `hl_get_market_price` | Get the mid price for a single coin |
| `hl_search_markets` | Search available markets by symbol substring |
| `hl_get_asset_context` | Full asset context: mark/oracle price, funding rate, open interest, 24h volume, premium, impact prices |
| `hl_get_user_state` | Raw perpetual account state for any public wallet address |
| `hl_get_open_orders` | Open orders for any public wallet address |
| `hl_get_position_summary` | Summarized positions (side, size, entry, PnL, liquidation price, leverage) for any public wallet |

### Dex support

Hyperliquid hosts markets on both its default venue and external DEXes (e.g. `DEX_NAME`). Tools that accept a `coin` parameter support two equivalent forms:

```
coin: "DEX_NAME:COIN"              # prefixed form
coin: "COIN",  dex: "DEX_NAME"    # split form
```

Both resolve to the same market.

---

## Examples

### Check API health

```
hl_health_check
```

```json
{ "success": true, "api_reachable": true, "mids_count": 312 }
```

---

### Get the mid price for COIN on dex DEX_NAME

```
hl_get_market_price  coin="COIN"  dex="DEX_NAME"
```

```json
{ "success": true, "coin": "DEX_NAME:COIN", "mid": "207.59" }
```

---

### Get full asset context for COIN on dex DEX_NAME

```
hl_get_asset_context  coin="COIN"  dex="DEX_NAME"
```

```json
{
  "success": true,
  "coin": "DEX_NAME:COIN",
  "dex": "DEX_NAME",
  "markPx": 207.59,
  "oraclePx": 207.59,
  "funding": 4.087e-7,
  "openInterest": 172955.2,
  "dayNtlVlm": 18346438.74,
  "premium": 0.0006775375,
  "impactPxs": ["207.6415", "207.8198"]
}
```

- **markPx / oraclePx** — current mark and oracle prices
- **funding** — current hourly funding rate (positive = longs pay shorts)
- **openInterest** — total open interest in base units
- **dayNtlVlm** — 24-hour notional volume in USD
- **premium** — mark / oracle deviation
- **impactPxs** — `[bid_impact, ask_impact]` — prices for a ~$5k market impact trade

---

### Search for COIN markets across dex DEX_NAME

```
hl_search_markets  query="COIN"  dex="DEX_NAME"
```

```json
{
  "success": true,
  "query": "COIN",
  "dex": "DEX_NAME",
  "count": 1,
  "matches": [{ "symbol": "DEX_NAME:COIN", "mid": "207.59" }]
}
```

---

### Inspect a public wallet's positions

```
hl_get_position_summary  user="0xabc...123"
```

```json
{
  "success": true,
  "user": "0xabc...123",
  "position_count": 1,
  "positions": [
    {
      "coin": "DEX_NAME:COIN",
      "side": "long",
      "size": 10.0,
      "entry_price": 195.40,
      "unrealized_pnl": 121.90,
      "liquidation_price": 147.20,
      "leverage": 5,
      "leverage_type": "cross",
      "margin_used": 390.80
    }
  ]
}
```

---

## Project Structure

```
src/
  server.ts        # MCP server — tool registry and request handlers
  hyperliquid.ts   # Thin fetch wrapper for the Hyperliquid /info endpoint
dist/              # Compiled output (generated by `npm run build`)
```

---

## License

ISC

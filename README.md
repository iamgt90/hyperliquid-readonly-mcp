# Hyperliquid Readonly MCP

If you found this project through GitHub, Claude Code, or an MCP workflow — welcome.

Hyperliquid Readonly MCP is a read-only Model Context Protocol server for Hyperliquid perpetual markets. It lets Claude and other MCP-compatible clients inspect market data, public wallet state, positions, open orders, funding, open interest, liquidation distance, and risk context.

It is designed for research, monitoring, and manual decision support.

It is not a trading bot.

## Warning

Not affiliated with Hyperliquid, Anthropic, Claude, or any exchange operator.

This project uses Hyperliquid public API endpoints only. Review the Disclaimer section before use.

## Important

This MCP server is read-only by design.

It cannot place trades, cancel orders, modify orders, close positions, change leverage, sign transactions, access private keys, access seed phrases, or move funds.

Only public wallet addresses are used.

## Note

All data is requested through Hyperliquid public API endpoints.

No browser automation is used. No wallet connection is required. No private key is required. No API key is required.

## What This MCP Does

| Feature | What it does |

|---|---|

| `hl_health_check` | Verifies that the Hyperliquid API is reachable |

| `hl_get_market_price` | Gets current mark/mid price for a coin |

| `hl_search_markets` | Searches markets by symbol or keyword |

| `hl_get_asset_context` | Reads funding, open interest, volume, premium, and impact prices |

| `hl_get_position_summary` | Reads public wallet perpetual positions |

| `hl_get_open_orders` | Reads public open orders |

| `hl_analyze_position_context` | Combines position, market, funding, and risk context into one snapshot |

## One-Shot Setup

Paste this into Claude Code and adapt the placeholders:

```text

Set up Hyperliquid Readonly MCP for me.

Clone https://github.com/YOUR_USERNAME/hyperliquid-readonly-mcp.git to ~/hyperliquid-readonly-mcp, run npm install, then run npm run build.

Then add it to my Claude Code MCP config.

Use this config block:

{

  "mcpServers": {

    "hyperliquid-readonly": {

      "command": "node",

      "args": ["/Users/YOUR_MAC_USERNAME/hyperliquid-readonly-mcp/dist/server.js"]

    }

  }

}

Replace YOUR_USERNAME with the GitHub username.

Replace YOUR_MAC_USERNAME with my local macOS username.

Finally restart Claude Code and verify with hl_health_check.

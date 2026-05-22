# Hyperliquid Readonly MCP

Hyperliquid Readonly MCP is a read-only Model Context Protocol server for Hyperliquid perpetual markets.

It lets Claude and other MCP-compatible clients inspect market data, public wallet state, positions, open orders, funding, open interest, liquidation distance, and risk context.

It is designed for research, monitoring, and manual decision support.

It is not a trading bot.

## Warning

Not affiliated with Hyperliquid, Anthropic, Claude, or any exchange operator.

This project uses Hyperliquid public API endpoints only.

## Important

This MCP server is read-only by design.

It cannot place trades, cancel orders, modify orders, close positions, change leverage, sign transactions, access private keys, access seed phrases, or move funds.

Only public wallet addresses are used.

## Quick Start

Clone the project:

```bash
git clone https://github.com/YOUR_USERNAME/hyperliquid-readonly-mcp.git
cd hyperliquid-readonly-mcp
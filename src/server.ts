import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { hyperliquidInfo } from "./hyperliquid.js";

const server = new Server(
  { name: "hyperliquid-readonly-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

const UserStateSchema = z.object({
  user: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});

const CoinSchema = z.object({
  coin: z.string(),
  dex: z.string().optional()
});

const SearchMarketsSchema = z.object({
  query: z.string(),
  dex: z.string().optional()
});

const PositionSummarySchema = z.object({
  user: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  dex: z.string().optional()
});

const AssetContextSchema = z.object({
  coin: z.string(),
  dex: z.string().optional()
});

const AnalyzePositionSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  coin: z.string(),
  dex: z.string().optional()
});

// If coin has a "prefix:SYMBOL" form, extract prefix as dex and return the full key.
// If dex is provided separately, prepend it to a bare symbol.
function resolveCoinKey(coin: string, dex?: string): { key: string; dex?: string } {
  const colon = coin.indexOf(":");
  if (colon !== -1) {
    const prefix = coin.slice(0, colon);
    const symbol = coin.slice(colon + 1);
    const resolved = dex ?? prefix;
    return { key: `${resolved}:${symbol}`, dex: resolved };
  }
  if (dex) return { key: `${dex}:${coin}`, dex };
  return { key: coin };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "hl_health_check",
      description: "Check Hyperliquid public info API. Read-only.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "hl_get_all_mids",
      description: "Get all current Hyperliquid mid prices. Read-only.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "hl_get_market_price",
      description: "Get current mid price for one Hyperliquid coin. Supports an optional dex (e.g. 'DEX_NAME'). Coin may include the dex prefix (e.g. 'DEX_NAME:COIN') or be bare (e.g. 'COIN'). Read-only.",
      inputSchema: {
        type: "object",
        properties: {
          coin: { type: "string", description: "Coin symbol, e.g. BTC, COIN, or DEX_NAME:COIN" },
          dex: { type: "string", description: "Optional dex name, e.g. DEX_NAME" }
        }
      }
    },
    {
      name: "hl_search_markets",
      description: "Search all available markets on Hyperliquid (optionally filtered to a dex) and return matching symbols. Read-only.",
      inputSchema: {
        type: "object",
        required: ["query"],
        properties: {
          query: { type: "string", description: "Case-insensitive substring to search for in market symbols" },
          dex: { type: "string", description: "Optional dex name to search within, e.g. DEX_NAME" }
        }
      }
    },
    {
      name: "hl_get_user_state",
      description: "Get Hyperliquid perpetual account state for a public wallet. Read-only.",
      inputSchema: {
        type: "object",
        required: ["user"],
        properties: {
          user: { type: "string", description: "Public wallet address, 0x..." }
        }
      }
    },
    {
      name: "hl_get_open_orders",
      description: "Get open Hyperliquid orders for a public wallet. Read-only.",
      inputSchema: {
        type: "object",
        required: ["user"],
        properties: {
          user: { type: "string", description: "Public wallet address, 0x..." }
        }
      }
    },
    {
      name: "hl_get_position_summary",
      description: "Get a summarized view of all open perpetual positions for a Hyperliquid wallet. Extracts coin, side, size, entry price, unrealized PnL, liquidation price, leverage, and margin used. Read-only.",
      inputSchema: {
        type: "object",
        required: ["user"],
        properties: {
          user: { type: "string", description: "Public wallet address, 0x..." },
          dex: { type: "string", description: "Optional dex name, e.g. DEX_NAME" }
        }
      }
    },
    {
      name: "hl_get_asset_context",
      description: "Get full asset context for a Hyperliquid coin: mark price, oracle price, funding rate, open interest, 24h notional volume, premium, and impact prices. Supports optional dex (e.g. DEX_NAME) and prefixed symbols (e.g. DEX_NAME:COIN). Read-only.",
      inputSchema: {
        type: "object",
        required: ["coin"],
        properties: {
          coin: { type: "string", description: "Coin symbol, e.g. BTC, COIN, or DEX_NAME:COIN" },
          dex: { type: "string", description: "Optional dex name, e.g. DEX_NAME" }
        }
      }
    },
    {
      name: "hl_analyze_position_context",
      description: "Combines position summary, open orders, market price, and asset context for a single coin into one snapshot. Returns position details plus derived metrics: liquidation distance in dollars and percent, unrealized PnL percent, and margin return percent. Read-only.",
      inputSchema: {
        type: "object",
        required: ["wallet", "coin"],
        properties: {
          wallet: { type: "string", description: "Public wallet address, 0x..." },
          coin: { type: "string", description: "Coin symbol, e.g. COIN or DEX_NAME:COIN" },
          dex: { type: "string", description: "Optional dex name, e.g. DEX_NAME" }
        }
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "hl_health_check") {
    const result = await hyperliquidInfo({ type: "allMids" });
    return { content: [{ type: "text", text: JSON.stringify({ success: true, api_reachable: true, mids_count: Object.keys(result).length }, null, 2) }] };
  }

  if (name === "hl_get_all_mids") {
    const result = await hyperliquidInfo({ type: "allMids" });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  if (name === "hl_get_market_price") {
    const parsed = CoinSchema.parse(args ?? {});
    const { key, dex: resolvedDex } = resolveCoinKey(parsed.coin, parsed.dex);
    const body: Record<string, unknown> = { type: "allMids" };
    if (resolvedDex) body.dex = resolvedDex;
    const mids = await hyperliquidInfo(body);
    const price = mids[key];
    return { content: [{ type: "text", text: JSON.stringify({ success: price !== undefined, coin: key, mid: price ?? null }, null, 2) }] };
  }

  if (name === "hl_search_markets") {
    const parsed = SearchMarketsSchema.parse(args ?? {});
    const body: Record<string, unknown> = { type: "allMids" };
    if (parsed.dex) body.dex = parsed.dex;
    const mids = await hyperliquidInfo(body);
    const q = parsed.query.toLowerCase();
    const matches = Object.entries(mids as Record<string, string>)
      .filter(([symbol]) => symbol.toLowerCase().includes(q))
      .map(([symbol, mid]) => ({ symbol, mid }));
    return { content: [{ type: "text", text: JSON.stringify({ success: true, query: parsed.query, dex: parsed.dex ?? null, count: matches.length, matches }, null, 2) }] };
  }

  if (name === "hl_get_user_state") {
    const parsed = UserStateSchema.parse(args ?? {});
    const result = await hyperliquidInfo({ type: "clearinghouseState", user: parsed.user });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  if (name === "hl_get_open_orders") {
    const parsed = UserStateSchema.parse(args ?? {});
    const result = await hyperliquidInfo({ type: "openOrders", user: parsed.user });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  }

  if (name === "hl_get_position_summary") {
    const parsed = PositionSummarySchema.parse(args ?? {});
    const body: Record<string, unknown> = { type: "clearinghouseState", user: parsed.user };
    if (parsed.dex) body.dex = parsed.dex;
    const state = await hyperliquidInfo(body);

    const positions = ((state.assetPositions ?? []) as Array<{ position: Record<string, unknown> }>)
      .map(({ position: p }) => p)
      .filter((p) => p.szi !== undefined && p.szi !== "0" && p.szi !== 0);

    const summary = positions.map((p) => {
      const size = parseFloat(p.szi as string);
      const leverage = p.leverage as Record<string, unknown> | undefined;
      return {
        coin: p.coin,
        side: size > 0 ? "long" : "short",
        size: Math.abs(size),
        entry_price: p.entryPx !== undefined ? parseFloat(p.entryPx as string) : null,
        unrealized_pnl: p.unrealizedPnl !== undefined ? parseFloat(p.unrealizedPnl as string) : null,
        liquidation_price: p.liquidationPx !== undefined ? parseFloat(p.liquidationPx as string) : null,
        leverage: leverage?.value ?? null,
        leverage_type: leverage?.type ?? null,
        margin_used: p.marginUsed !== undefined ? parseFloat(p.marginUsed as string) : null
      };
    });

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ success: true, user: parsed.user, position_count: summary.length, positions: summary }, null, 2)
      }]
    };
  }

  if (name === "hl_get_asset_context") {
    const parsed = AssetContextSchema.parse(args ?? {});
    const { key, dex: resolvedDex } = resolveCoinKey(parsed.coin, parsed.dex);
    const body: Record<string, unknown> = { type: "metaAndAssetCtxs" };
    if (resolvedDex) body.dex = resolvedDex;
    const [meta, assetCtxs] = await hyperliquidInfo(body) as [
      { universe: Array<{ name: string }> },
      Array<Record<string, unknown>>
    ];

    const symbol = key.includes(":") ? key.split(":")[1] : key;
    let idx = meta.universe.findIndex((u) => u.name === key);
    if (idx === -1) idx = meta.universe.findIndex((u) => u.name === symbol);
    if (idx === -1) idx = meta.universe.findIndex((u) => {
      const uSymbol = u.name.includes(":") ? u.name.split(":")[1] : u.name;
      return uSymbol.toLowerCase() === symbol.toLowerCase();
    });

    if (idx === -1) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: false, coin: key, error: "Asset not found" }, null, 2)
        }]
      };
    }

    const ctx = assetCtxs[idx];
    const num = (v: unknown) => (v !== undefined && v !== null ? parseFloat(v as string) : null);

    const result: Record<string, unknown> = {
      success: true,
      coin: key,
      dex: resolvedDex ?? null,
      markPx: num(ctx.markPx),
      oraclePx: num(ctx.oraclePx),
      funding: num(ctx.funding),
      openInterest: num(ctx.openInterest),
      dayNtlVlm: num(ctx.dayNtlVlm)
    };

    if (ctx.premium !== undefined && ctx.premium !== null) result.premium = num(ctx.premium);
    if (ctx.impactPxs !== undefined && ctx.impactPxs !== null) result.impactPxs = ctx.impactPxs;

    return {
      content: [{
        type: "text",
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  if (name === "hl_analyze_position_context") {
    const parsed = AnalyzePositionSchema.parse(args ?? {});
    const { key, dex: resolvedDex } = resolveCoinKey(parsed.coin, parsed.dex);
    const symbol = key.includes(":") ? key.split(":")[1] : key;
    const dexBody: Record<string, unknown> = resolvedDex ? { dex: resolvedDex } : {};

    const [stateRes, ordersRes, midsRes, metaRes] = await Promise.all([
      hyperliquidInfo({ type: "clearinghouseState", user: parsed.wallet, ...dexBody }),
      hyperliquidInfo({ type: "openOrders", user: parsed.wallet }),
      hyperliquidInfo({ type: "allMids", ...dexBody }),
      hyperliquidInfo({ type: "metaAndAssetCtxs", ...dexBody })
    ]);

    // Position
    const rawPos = ((stateRes.assetPositions ?? []) as Array<{ position: Record<string, unknown> }>)
      .map(({ position: p }) => p)
      .filter((p) => p.szi !== undefined && p.szi !== "0" && p.szi !== 0)
      .find((p) => { const c = p.coin as string; return c === key || c === symbol; });

    // Market price
    const mid = (midsRes as Record<string, string>)[key] ?? (midsRes as Record<string, string>)[symbol] ?? null;
    const currentPx = mid ? parseFloat(mid) : null;

    // Asset context
    const [meta, assetCtxs] = metaRes as [
      { universe: Array<{ name: string }> },
      Array<Record<string, unknown>>
    ];
    const num = (v: unknown) => (v !== undefined && v !== null ? parseFloat(v as string) : null);
    let idx = meta.universe.findIndex((u) => u.name === key);
    if (idx === -1) idx = meta.universe.findIndex((u) => u.name === symbol);
    if (idx === -1) idx = meta.universe.findIndex((u) => {
      const s = u.name.includes(":") ? u.name.split(":")[1] : u.name;
      return s.toLowerCase() === symbol.toLowerCase();
    });
    const ctx = idx !== -1 ? assetCtxs[idx] : null;

    // Open orders filtered to this coin
    const openOrders = ((ordersRes as Array<Record<string, unknown>>))
      .filter((o) => { const c = o.coin as string; return c === key || c === symbol; })
      .map((o) => ({
        oid: o.oid,
        side: o.side,
        price: num(o.limitPx),
        size: num(o.sz),
        reduce_only: o.reduceOnly ?? false,
        order_type: o.orderType ?? null,
        timestamp: o.timestamp ?? null
      }));

    // Build position block and derived metrics
    let position: Record<string, unknown> | null = null;
    let liq_distance_dollars: number | null = null;
    let liq_distance_pct: number | null = null;
    let unrealized_pnl_pct: number | null = null;
    let margin_return_pct: number | null = null;

    if (rawPos) {
      const size = parseFloat(rawPos.szi as string);
      const absSize = Math.abs(size);
      const side = size > 0 ? "long" : "short";
      const entryPx = num(rawPos.entryPx);
      const liqPx = num(rawPos.liquidationPx);
      const unrealizedPnl = num(rawPos.unrealizedPnl);
      const marginUsed = num(rawPos.marginUsed);
      const leverage = rawPos.leverage as Record<string, unknown> | undefined;

      position = {
        coin: rawPos.coin,
        side,
        size: absSize,
        entry_price: entryPx,
        liquidation_price: liqPx,
        leverage: leverage?.value ?? null,
        leverage_type: leverage?.type ?? null,
        margin_used: marginUsed,
        unrealized_pnl: unrealizedPnl
      };

      if (liqPx !== null && currentPx !== null) {
        const dist = side === "long" ? currentPx - liqPx : liqPx - currentPx;
        liq_distance_dollars = Math.round(dist * 100) / 100;
        liq_distance_pct = Math.round((dist / currentPx) * 10000) / 100;
      }
      if (unrealizedPnl !== null && entryPx !== null && absSize > 0) {
        unrealized_pnl_pct = Math.round((unrealizedPnl / (entryPx * absSize)) * 10000) / 100;
      }
      if (unrealizedPnl !== null && marginUsed !== null && marginUsed > 0) {
        margin_return_pct = Math.round((unrealizedPnl / marginUsed) * 10000) / 100;
      }
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          wallet: parsed.wallet,
          coin: key,
          dex: resolvedDex ?? null,
          position,
          current_market: {
            mid_price: currentPx,
            mark_price: ctx ? num(ctx.markPx) : null,
            oracle_price: ctx ? num(ctx.oraclePx) : null,
            premium: ctx?.premium !== undefined ? num(ctx.premium) : null,
            impact_prices: ctx?.impactPxs ?? null
          },
          funding: ctx ? num(ctx.funding) : null,
          open_interest: ctx ? num(ctx.openInterest) : null,
          volume_24h: ctx ? num(ctx.dayNtlVlm) : null,
          open_orders: openOrders,
          liq_distance_dollars,
          liq_distance_pct,
          unrealized_pnl_pct,
          margin_return_pct
        }, null, 2)
      }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hyperliquid Readonly MCP running");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

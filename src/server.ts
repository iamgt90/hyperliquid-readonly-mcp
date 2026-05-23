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
      description: "Get current mid price for one Hyperliquid coin. Supports an optional dex (e.g. 'xyz'). Coin may include the dex prefix (e.g. 'xyz:SPCX') or be bare (e.g. 'SPCX'). Read-only.",
      inputSchema: {
        type: "object",
        properties: {
          coin: { type: "string", description: "Coin symbol, e.g. BTC, SPCX, or xyz:SPCX" },
          dex: { type: "string", description: "Optional dex name, e.g. xyz" }
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
          dex: { type: "string", description: "Optional dex name to search within, e.g. xyz" }
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
          dex: { type: "string", description: "Optional dex name, e.g. xyz" }
        }
      }
    },
    {
      name: "hl_get_asset_context",
      description: "Get full asset context for a Hyperliquid coin: mark price, oracle price, funding rate, open interest, 24h notional volume, premium, and impact prices. Supports optional dex (e.g. xyz) and prefixed symbols (e.g. xyz:SPCX). Read-only.",
      inputSchema: {
        type: "object",
        required: ["coin"],
        properties: {
          coin: { type: "string", description: "Coin symbol, e.g. BTC, SPCX, or xyz:SPCX" },
          dex: { type: "string", description: "Optional dex name, e.g. xyz" }
        }
      }
    },
    {
      name: "hl_analyze_position_context",
      description: "Full position risk snapshot for a single coin. Returns position details, market context, and derived metrics: liquidation buffer, PnL on margin, notional value, annualized funding estimate, open order summary, machine-readable risk_flags array, risk_level (low/medium/high/critical), and a human-readable summary field. Read-only.",
      inputSchema: {
        type: "object",
        required: ["wallet", "coin"],
        properties: {
          wallet: { type: "string", description: "Public wallet address, 0x..." },
          coin: { type: "string", description: "Coin symbol, e.g. SPCX or xyz:SPCX" },
          dex: { type: "string", description: "Optional dex name, e.g. xyz" }
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

    const order_count = openOrders.length;
    const has_open_orders = order_count > 0;

    // Funding rate and annualized estimate (8-hour rate × 3 × 365)
    const fundingRate = ctx ? num(ctx.funding) : null;
    const funding_annualized_estimate = fundingRate !== null
      ? Math.round(fundingRate * 1095 * 10000) / 100
      : null;

    // Build position block and derived metrics
    let position: Record<string, unknown> | null = null;
    let liq_distance_dollars: number | null = null;
    let liq_distance_pct: number | null = null;
    let liquidation_buffer_pct_from_current_price: number | null = null;
    let unrealized_pnl_pct: number | null = null;
    let pnl_on_margin_pct: number | null = null;
    let notional_value: number | null = null;

    let positionSide: string | null = null;
    let leverageValue: number | null = null;
    let leverageType: string | null = null;
    let unrealizedPnl: number | null = null;

    if (rawPos) {
      const size = parseFloat(rawPos.szi as string);
      const absSize = Math.abs(size);
      positionSide = size > 0 ? "long" : "short";
      const entryPx = num(rawPos.entryPx);
      const liqPx = num(rawPos.liquidationPx);
      unrealizedPnl = num(rawPos.unrealizedPnl);
      const marginUsed = num(rawPos.marginUsed);
      const leverage = rawPos.leverage as Record<string, unknown> | undefined;
      leverageValue = num(leverage?.value);
      leverageType = (leverage?.type as string) ?? null;

      position = {
        coin: rawPos.coin,
        side: positionSide,
        size: absSize,
        entry_price: entryPx,
        liquidation_price: liqPx,
        leverage: leverageValue,
        leverage_type: leverageType,
        margin_used: marginUsed,
        unrealized_pnl: unrealizedPnl
      };

      if (currentPx !== null) {
        notional_value = Math.round(absSize * currentPx * 100) / 100;
      }

      if (liqPx !== null && currentPx !== null) {
        const dist = positionSide === "long" ? currentPx - liqPx : liqPx - currentPx;
        liq_distance_dollars = Math.round(dist * 100) / 100;
        liq_distance_pct = Math.round((dist / currentPx) * 10000) / 100;
        liquidation_buffer_pct_from_current_price = liq_distance_pct;
      }
      if (unrealizedPnl !== null && entryPx !== null && absSize > 0) {
        unrealized_pnl_pct = Math.round((unrealizedPnl / (entryPx * absSize)) * 10000) / 100;
      }
      if (unrealizedPnl !== null && marginUsed !== null && marginUsed > 0) {
        pnl_on_margin_pct = Math.round((unrealizedPnl / marginUsed) * 10000) / 100;
      }
    }

    // Risk flags
    const risk_flags: string[] = [];
    if (liq_distance_pct !== null && liq_distance_pct < 10) risk_flags.push("near_liquidation");
    if (leverageValue !== null && leverageValue > 10) risk_flags.push("high_leverage");
    if (unrealizedPnl !== null && unrealizedPnl < 0) risk_flags.push("negative_pnl");
    if (unrealizedPnl !== null && unrealizedPnl > 0) risk_flags.push("positive_pnl");
    // positive funding = longs pay shorts; negative funding = shorts pay longs
    if (fundingRate !== null && positionSide !== null) {
      const paying = (positionSide === "long" && fundingRate > 0) || (positionSide === "short" && fundingRate < 0);
      if (paying) risk_flags.push("funding_cost");
    }
    if (!has_open_orders) risk_flags.push("no_open_orders");
    if (leverageType === "isolated") risk_flags.push("isolated_margin");
    if (leverageType === "cross") risk_flags.push("cross_margin");

    // Risk level: driven primarily by liquidation proximity, secondarily by leverage
    let risk_level = "low";
    if (liq_distance_pct !== null && liq_distance_pct < 5) {
      risk_level = "critical";
    } else if ((liq_distance_pct !== null && liq_distance_pct < 10) || (leverageValue !== null && leverageValue > 20)) {
      risk_level = "high";
    } else if ((liq_distance_pct !== null && liq_distance_pct < 20) || (leverageValue !== null && leverageValue > 10)) {
      risk_level = "medium";
    }

    // Human-readable summary
    let summary: string;
    if (!position) {
      summary = `No open ${key} position found for this wallet.`;
    } else {
      const liqStr = liq_distance_pct !== null
        ? ` Liq buffer: ${liq_distance_pct}% ($${liq_distance_dollars}).`
        : "";
      const pnlStr = unrealized_pnl_pct !== null
        ? ` PnL: ${unrealized_pnl_pct}% on position${pnl_on_margin_pct !== null ? `, ${pnl_on_margin_pct}% on margin` : ""}.`
        : "";
      const fundStr = funding_annualized_estimate !== null
        ? ` Funding ~${funding_annualized_estimate}%/yr.`
        : "";
      const orderStr = has_open_orders ? ` ${order_count} open order(s).` : " No open orders.";
      const flagStr = risk_flags.length > 0 ? ` Flags: ${risk_flags.join(", ")}.` : "";
      summary = `${positionSide?.toUpperCase()} ${key} x${leverageValue ?? "?"} [${risk_level.toUpperCase()}].${liqStr}${pnlStr}${fundStr}${orderStr}${flagStr}`;
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
          funding: fundingRate,
          funding_annualized_estimate,
          open_interest: ctx ? num(ctx.openInterest) : null,
          volume_24h: ctx ? num(ctx.dayNtlVlm) : null,
          notional_value,
          open_orders: openOrders,
          order_count,
          has_open_orders,
          liq_distance_dollars,
          liq_distance_pct,
          liquidation_buffer_pct_from_current_price,
          unrealized_pnl_pct,
          pnl_on_margin_pct,
          risk_flags,
          risk_level,
          summary
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

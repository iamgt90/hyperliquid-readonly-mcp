const BASE_URL = process.env.HYPERLIQUID_BASE_URL || "https://api.hyperliquid.xyz";

export async function hyperliquidInfo(body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hyperliquid info error ${res.status}: ${text}`);
  }

  return res.json();
}

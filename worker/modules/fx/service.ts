export interface Env {
  KV_CACHE: KVNamespace;
}

export async function getFxRate(env: Env): Promise<{ rate: number; source: string }> {
  const cacheKey = "fx:sgd-usd";
  try {
    const cached = await env.KV_CACHE.get<{ rate: number }>(cacheKey, "json");
    if (cached?.rate) return { rate: cached.rate, source: "cache" };

    const res = await fetch(
      "https://cdn.jsdelivr.net/gh/fawazahmed0/exchange-api@1/latest/currencies/sgd/usd.json",
    );

    if (!res.ok) throw new Error("Failed to fetch FX rate");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    const rate = data.usd;

    await env.KV_CACHE.put(cacheKey, JSON.stringify({ rate }), { expirationTtl: 1800 });
    return { rate, source: "api" };
  } catch (e) {
    console.error("FX Fetch Error", e);
    return { rate: 0.74, source: "fallback" };
  }
}

import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpOrdersApi } from "../src/clients/orders-api.js";

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

function stubFetch(...responses: Response[]) {
  const fetch = vi.fn();
  for (const r of responses) fetch.mockResolvedValueOnce(r);
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const api = () => new HttpOrdersApi("http://api.test", { rps: 1000 });

describe("HttpOrdersApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("200 с { error: rate_limited } ретраит", async () => {
    const fetch = stubFetch(json({ error: "rate_limited" }), json({ items: [], nextCursor: null }));
    await expect(api().getOrdersPage(null, 100)).resolves.toEqual({ items: [], nextCursor: null });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("429 ретраит", async () => {
    const fetch = stubFetch(json({ error: "rate_limited" }, 429, { "retry-after": "0" }), json({ items: [], nextCursor: "p2" }));
    await expect(api().getOrdersPage(null, 100)).resolves.toEqual({ items: [], nextCursor: "p2" });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("другая ошибка в теле 200 не ретраится и не теряет причину", async () => {
    const fetch = stubFetch(json({ error: "internal", message: "db down" }));
    await expect(api().getOrdersPage(null, 100)).rejects.toThrow(/db down/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("404 клиента — null", async () => {
    stubFetch(json({ error: "not_found" }, 404));
    await expect(api().getCustomer("nobody")).resolves.toBeNull();
  });
});

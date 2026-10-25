import type { ApiCard, ApiCardSummary, ApiSet } from "./types";
const ROOT = "https://api.tcgdex.net/v2";
const API = (import.meta.env.VITE_API_URL || "https://pokelist-api.onrender.com").replace(/\/$/, "");
async function request<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok)
    throw new Error(
      res.status === 404
        ? "Nenhuma carta encontrada."
        : "Não foi possível acessar a TCGdex agora.",
    );
  return res.json() as Promise<T>;
}
export async function searchCards(
  query: string,
  signal?: AbortSignal,
): Promise<ApiCardSummary[]> {
  const q = encodeURIComponent(query.trim());
  // Prefer the backend so repeated searches benefit from Render Key Value.
  // Preserve the original catalog fallback during the migration.
  try {
    return await request<ApiCardSummary[]>(`${API}/api/v1/cards?name=${q}&language=en`, signal);
  } catch (error) {
    if (signal?.aborted) throw error;
  }
  const results = new Map<string, ApiCardSummary>();
  let lastError: unknown;
  for (const lang of ["en", "pt-br"]) {
    try {
      const cards = await request<ApiCardSummary[]>(
        `${ROOT}/${lang}/cards?name=${q}`,
        signal,
      );
      for (const card of cards) results.set(card.id, card);
    } catch (error) {
      if (signal?.aborted) throw error;
      lastError = error;
    }
  }
  if (!results.size && lastError) throw lastError;
  return [...results.values()];
}
let setsCache: Promise<ApiSet[]> | null = null;
export async function getSets(): Promise<ApiSet[]> {
  const pending = (setsCache ??= (async () => {
    const english = await request<ApiSet[]>(`${API}/api/v1/sets?language=en`).catch(() => request<ApiSet[]>(`${ROOT}/en/sets`));
    const [brazilian, pocketSeries] = await Promise.all([
      request<ApiSet[]>(`${API}/api/v1/sets?language=pt-br`).catch(() => request<ApiSet[]>(`${ROOT}/pt-br/sets`)).catch(() => []),
      request<{ sets?: Array<{ id: string }> }>(`${ROOT}/en/series/tcgp`).catch(
        () => null,
      ),
    ]);
    const localized = new Map<string, ApiSet>(
      brazilian.map((set) => [set.id, set] as const),
    );
    const pocketIds = new Set(pocketSeries?.sets?.map((set) => set.id) || []);
    const isPocket = (set: ApiSet) =>
      pocketIds.has(set.id) ||
      [set.logo, set.symbol].some((url) => url?.includes("/tcgp/")) ||
      /^(P-A|[A-Z]\d+[a-z]?)$/.test(set.id);
    return english
      .filter((set) => !isPocket(set))
      .map((set) => ({
        ...set,
        name: localized.get(set.id)?.name || set.name,
      }));
  })());
  try {
    return await pending;
  } catch (error) {
    if (setsCache === pending) setsCache = null;
    throw error;
  }
}
export async function getSet(
  id: string,
  language = "pt-br",
): Promise<ApiCard[]> {
  try {
    const cards = await request<ApiCard[]>(
      `${API}/api/v1/sets/${encodeURIComponent(id)}/cards?language=${encodeURIComponent(language)}`,
    );
    const set = { cards };
    return (set.cards || []).map((c) => ({
      ...c,
      set: { ...c.set, id: c.set?.id || id, name: c.set?.name || "" },
    }));
  } catch {
    const set = await request<{ cards: ApiCard[] }>(
      `${ROOT}/en/sets/${encodeURIComponent(id)}`,
    );
    return (set.cards || []).map((c) => ({
      ...c,
      set: { ...c.set, id: c.set?.id || id, name: c.set?.name || "" },
    }));
  }
}
export function imageUrl(image?: string) {
  if (!image) return null;
  const base = image.replace(/\/(?:high|low)(?:\.png)?$/, "");
  return `${base}/high.png`;
}

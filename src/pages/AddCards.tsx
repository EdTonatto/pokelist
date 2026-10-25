import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Layers3,
  Plus,
  Search,
  X,
} from "lucide-react";
import { ImageExpand } from "../components/ImagePreview";
import {
  availableQuantity,
  now,
  quantity,
  acquiredQuantity,
  uid,
  formatCurrency,
} from "../lib/wishlist";
import { getSet, getSets, imageUrl, searchCards } from "../tcgdex";
import type { ApiCard, ApiCardSummary, ApiSet, Wishlist } from "../types";

export function AddCards({
  lists,
  onSave,
}: {
  lists: Wishlist[];
  onSave: (x: Wishlist[]) => Promise<void>;
}) {
  const { id } = useParams(),
    nav = useNavigate(),
    list = lists.find((l) => l.id === id),
    [tab, setTab] = useState<"name" | "number" | "set">("name"),
    [query, setQuery] = useState(""),
    [results, setResults] = useState<ApiCard[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<ApiCard[]>([]),
    [quantities, setQuantities] = useState<Record<string, number>>({}),
    [prices, setPrices] = useState<Record<string, string>>({}),
    [sets, setSets] = useState<ApiSet[]>([]),
    [setId, setSetId] = useState(""),
    [setCards, setSetCards] = useState<ApiCard[]>([]),
    [loadingSet, setSetLoading] = useState(false),
    [setFilter, setSetFilter] = useState("");
  useEffect(() => {
    getSets()
      .then(setSets)
      .catch(() => setError("Não foi possível carregar os sets."));
  }, []);
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const controller = new AbortController(),
      timer = setTimeout(async () => {
        setLoading(true);
        setError("");
        try {
          if (tab === "number") {
            const match = query.trim().match(/^(\d+[a-z]?)\s*\/\s*(\d+)$/i);
            if (!match) {
              setResults([]);
              setError("Digite o número no formato 01/98.");
              return;
            }
            const [, rawLocalId, denom] = match;
            const localMatch = rawLocalId.match(/^0*(\d+)([a-z]?)$/i);
            const localId = localMatch
              ? `${Number(localMatch[1])}${localMatch[2]}`
              : rawLocalId;
            const total = Number(denom);
            const allSets = sets.length ? sets : await getSets();
            if (!sets.length) setSets(allSets);
            const candidates = allSets.filter(
              (s) =>
                Number(s.cardCount?.official) === total ||
                Number(s.cardCount?.total) === total,
            );
            const found: (ApiCard | null)[] = await Promise.all(
              candidates.map(async (s) => {
                try {
                  let response = await fetch(
                    `https://api.tcgdex.net/v2/pt-br/sets/${encodeURIComponent(s.id)}/${encodeURIComponent(localId)}`,
                    { signal: controller.signal },
                  );
                  if (!response.ok)
                    response = await fetch(
                      `https://api.tcgdex.net/v2/en/sets/${encodeURIComponent(s.id)}/${encodeURIComponent(localId)}`,
                      { signal: controller.signal },
                    );
                  if (!response.ok) return null;
                  const c = (await response.json()) as ApiCard;
                  return {
                    ...c,
                    set: {
                      ...c.set,
                      id: s.id,
                      name: c.set?.name || s.name,
                      cardCount: s.cardCount,
                    },
                  };
                } catch {
                  return null;
                }
              }),
            );
            setResults(found.filter((x): x is ApiCard => x !== null));
          } else {
            const cards = await searchCards(query, controller.signal);
            const catalogSets = sets.length ? sets : await getSets();
            if (!sets.length) setSets(catalogSets);
            setResults(
              cards.flatMap((card: ApiCardSummary) => {
                const matched = [...catalogSets]
                  .filter((s) => card.id.startsWith(`${s.id}-`))
                  .sort((a, b) => b.id.length - a.id.length)[0];
                return matched
                  ? [
                      {
                        ...card,
                        set: {
                          id: matched.id,
                          name: matched.name,
                          cardCount: matched.cardCount,
                        },
                      },
                    ]
                  : [];
              }),
            );
          }
        } catch (e) {
          if (!controller.signal.aborted) {
            setError(
              e instanceof Error
                ? e.message
                : "Não foi possível buscar cartas.",
            );
            setResults([]);
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, tab]);
  if (!list)
    return (
      <div className="empty">
        <h3>Lista não encontrada</h3>
        <Link to="/lists">Voltar às listas</Link>
      </div>
    );
  const currentList: Wishlist = list;
  function toggle(card: ApiCard) {
    if (selected.some((c) => c.id === card.id)) {
      setSelected((v) => v.filter((c) => c.id !== card.id));
      setQuantities((v) => {
        const next = { ...v };
        delete next[card.id];
        return next;
      });
    } else {
      setSelected((v) => [...v, card]);
      setQuantities((v) => ({ ...v, [card.id]: v[card.id] || 1 }));
    }
  }
  function changeQuantity(card: ApiCard, value: number) {
    const quantity = Math.max(0, Math.min(999, value));
    if (quantity === 0) {
      setSelected((v) => v.filter((c) => c.id !== card.id));
      setQuantities((v) => {
        const next = { ...v };
        delete next[card.id];
        return next;
      });
      return;
    }
    setSelected((v) => (v.some((c) => c.id === card.id) ? v : [...v, card]));
    setQuantities((v) => ({ ...v, [card.id]: quantity }));
  }
  async function loadSet(val: string) {
    setSetId(val);
    setSelected([]);
    setQuantities({});
    setPrices({});
    if (!val) {
      setSetCards([]);
      return;
    }
    setSetLoading(true);
    setError("");
    try {
      const cards = await getSet(val);
      const s = sets.find((x) => x.id === val);
      setSetCards(
        cards.map((c) => ({
          ...c,
          set: {
            ...c.set,
            id: val,
            name: c.set.name || s?.name || val,
            cardCount: s?.cardCount,
          },
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar set");
    } finally {
      setSetLoading(false);
    }
  }
  function salePrice(cardId: string) {
    const digits = (prices[cardId] || "").replace(/\D/g, "");
    return digits ? Number(digits) / 100 : undefined;
  }
  function toWishlistItems(cards: ApiCard[], createdAt: string) {
    return cards
      .filter((c) => !currentList.items.some((i) => i.providerCardId === c.id))
      .map((c) => ({
        id: uid(),
        wishlistId: currentList.id,
        provider: "tcgdex" as const,
        providerCardId: c.id,
        cardName: c.name,
        localId: String(c.localId),
        setId: c.set.id,
        setName: c.set.name,
        setOfficialTotal:
          c.set.cardCount?.official || c.set.cardCount?.total || 0,
        imageUrl: imageUrl(c.image),
        language: "pt-br",
        status: "wanted" as const,
        acquiredQuantity: 0,
        availableQuantity: currentList.purpose === "trade" ? 1 : undefined,
        salePrice: undefined,
        createdAt,
        updatedAt: createdAt,
      }));
  }
  async function add() {
    const t = now(),
      items = currentList.items.map((existing) => {
        const card = selected.find((c) => c.id === existing.providerCardId);
        if (!card) return existing;
        if (currentList.purpose === "trade")
          return {
            ...existing,
            availableQuantity:
              availableQuantity(existing) + (quantities[card.id] || 1),
            salePrice: salePrice(card.id) ?? existing.salePrice,
            updatedAt: t,
          };
        const desired = quantity(existing) + (quantities[card.id] || 1),
          got = acquiredQuantity(existing);
        return {
          ...existing,
          quantity: desired,
          acquiredQuantity: got,
          status: got >= desired ? ("acquired" as const) : ("wanted" as const),
          acquiredAt: got >= desired ? existing.acquiredAt : undefined,
          updatedAt: t,
        };
      }),
      newItems = selected
        .filter(
          (c) => !currentList.items.some((i) => i.providerCardId === c.id),
        )
        .flatMap((c) =>
          toWishlistItems([c], t).map((item) => ({
            ...item,
            quantity:
              currentList.purpose === "trade" ? 1 : quantities[c.id] || 1,
            availableQuantity:
              currentList.purpose === "trade"
                ? quantities[c.id] || 1
                : undefined,
            salePrice: salePrice(c.id),
            acquiredQuantity: 0,
          })),
        );
    await onSave(
      lists.map((l) =>
        l.id === currentList.id
          ? { ...l, items: [...items, ...newItems], updatedAt: t }
          : l,
      ),
    );
    nav(`/lists/${id}`);
  }
  async function addEntireSet() {
    const t = now(),
      items = toWishlistItems(setCards, t).map((item) => ({
        ...item,
        quantity: 1,
        availableQuantity: currentList.purpose === "trade" ? 1 : undefined,
        acquiredQuantity: 0,
      }));
    if (!items.length) return;
    await onSave(
      lists.map((l) =>
        l.id === currentList.id
          ? { ...l, items: [...l.items, ...items], updatedAt: t }
          : l,
      ),
    );
    nav(`/lists/${id}`);
  }
  const visibleSets = sets.filter((s) =>
    `${s.name} ${s.id}`.toLowerCase().includes(setFilter.trim().toLowerCase()),
  );
  const shown = tab === "set" ? setCards : results,
    allShownSelected =
      shown.length > 0 &&
      shown.every((card) => selected.some((item) => item.id === card.id)),
    anyShownSelected = shown.some((card) =>
      selected.some((item) => item.id === card.id),
    ),
    selectedCopies = selected.reduce(
      (total, card) => total + (quantities[card.id] || 1),
      0,
    );
  function selectAllShown() {
    setSelected((previous) => [
      ...previous.filter((item) => !shown.some((card) => card.id === item.id)),
      ...shown,
    ]);
    setQuantities((previous) => ({
      ...previous,
      ...Object.fromEntries(
        shown.map((card) => [card.id, previous[card.id] || 1]),
      ),
    }));
  }
  function deselectShown() {
    setSelected((previous) =>
      previous.filter((card) => !shown.some((item) => item.id === card.id)),
    );
    setQuantities((previous) => {
      const next = { ...previous };
      shown.forEach((card) => delete next[card.id]);
      return next;
    });
  }
  return (
    <>
      <div className="backline">
        <Link to={`/lists/${id}`}>
          <ArrowLeft size={16} /> {list.name}
        </Link>
      </div>
      <div className="page-title-row add-title">
        <div>
          <div className="eyebrow">ADICIONAR À LISTA</div>
          <h1>Encontre suas cartas</h1>
          <p>
            {currentList.purpose === "trade"
              ? "Escolha as quantidades disponíveis e informe o preço de venda se quiser."
              : "Busque pelo nome, número impresso ou explore um set."}
          </p>
        </div>
      </div>
      <div className="add-panel">
        <div className="tabs add-tabs">
          <button
            className={tab === "name" ? "active" : ""}
            onClick={() => {
              setTab("name");
              setSelected([]);
              setQuantities({});
              setPrices({});
            }}
          >
            <Search size={16} /> Buscar por nome
          </button>
          <button
            className={tab === "number" ? "active" : ""}
            onClick={() => {
              setTab("number");
              setSelected([]);
              setQuantities({});
              setPrices({});
            }}
          >
            <span className="number-icon">#</span> Número impresso
          </button>
          <button
            className={tab === "set" ? "active" : ""}
            onClick={() => {
              setTab("set");
              setSelected([]);
              setQuantities({});
              setPrices({});
            }}
          >
            <Layers3 size={16} /> Explorar sets
          </button>
        </div>
        {tab !== "set" ? (
          <div className="search-panel">
            <label>
              {tab === "name" ? "Nome da carta ou Pokémon" : "Número impresso"}
            </label>
            <div className="large-search">
              <Search size={20} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  tab === "name" ? "Ex.: Pikachu, Charizard..." : "Ex.: 01/98"
                }
              />
              <button onClick={() => setQuery("")}>
                <X size={16} />
              </button>
            </div>
            {tab === "number" && (
              <p className="helper">
                A busca encontra os números locais e mostra os sets compatíveis.
                Ex.: 01/98
              </p>
            )}
          </div>
        ) : (
          <div className="search-panel">
            <label>Escolha uma coleção</label>
            <div className="search-box set-filter">
              <Search size={16} />
              <input
                value={setFilter}
                onChange={(e) => setSetFilter(e.target.value)}
                placeholder="Filtrar coleções por nome ou código..."
              />
            </div>
            <div className="select-wrap">
              <select
                value={setId}
                onChange={(e) => void loadSet(e.target.value)}
              >
                <option value="">Selecione um set...</option>
                {visibleSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ·{" "}
                    {s.cardCount?.official || s.cardCount?.total || "?"} cartas
                  </option>
                ))}
              </select>
              <ChevronDown size={17} />
            </div>
            <p className="helper">
              {visibleSets.length} de {sets.length} coleções físicas
            </p>
          </div>
        )}
        <div className="results-heading">
          {loading || loadingSet
            ? "BUSCANDO NO CATÁLOGO..."
            : shown.length
              ? `${shown.length} CARTAS ENCONTRADAS`
              : "RESULTADOS"}
          <span>TCGDEX · {tab === "set" ? "COLEÇÃO" : "CATÁLOGO"}</span>
        </div>
        {shown.length > 0 && (
          <div className="bulk-select-bar">
            <span>
              {
                selected.filter((card) =>
                  shown.some((item) => item.id === card.id),
                ).length
              }{" "}
              cartas ·{" "}
              {selected
                .filter((card) => shown.some((item) => item.id === card.id))
                .reduce(
                  (sum, card) => sum + (quantities[card.id] || 1),
                  0,
                )}{" "}
              {currentList.purpose === "trade" ? "disponíveis" : "cópias"}
            </span>
            <div>
              <button
                type="button"
                onClick={selectAllShown}
                disabled={allShownSelected}
              >
                Marcar todos
              </button>
              <button
                type="button"
                onClick={deselectShown}
                disabled={!anyShownSelected}
              >
                Desmarcar todos
              </button>
            </div>
          </div>
        )}
        {error && <div className="error-box">{error}</div>}
        {!loading && !loadingSet && shown.length === 0 && (
          <div className="search-empty">
            {query.length < 2 && tab !== "set"
              ? "Digite pelo menos 2 caracteres para buscar."
              : tab === "set" && !setId
                ? "Escolha um set para ver suas cartas."
                : query.length >= 2 || setId
                  ? "Nenhuma carta encontrada."
                  : "A busca é feita diretamente no catálogo TCGdex."}
          </div>
        )}
        <div className="search-results">
          {shown.map((c) => (
            <SearchResult
              key={c.id}
              card={c}
              selected={selected.some((x) => x.id === c.id)}
              onClick={() => toggle(c)}
              quantity={quantities[c.id] || 0}
              onQuantityChange={(value) => changeQuantity(c, value)}
              set={sets.find((s) => s.id === c.set.id)}
              isTrade={currentList.purpose === "trade"}
              salePrice={prices[c.id] || ""}
              onSalePriceChange={(value) =>
                setPrices((previous) => ({ ...previous, [c.id]: value }))
              }
            />
          ))}
        </div>
        {tab === "set" && setId && setCards.length > 0 && (
          <div className="set-add-bar">
            <span>
              {Math.max(
                0,
                setCards.length -
                  setCards.filter((c) =>
                    currentList.items.some((i) => i.providerCardId === c.id),
                  ).length,
              )}{" "}
              cartas novas neste set
            </span>
            <button
              className="button primary"
              onClick={() => void addEntireSet()}
            >
              <Plus size={16} /> Adicionar set inteiro
            </button>
          </div>
        )}
        {selected.length > 0 && (
          <div className="selection-bar">
            <span>
              <b>{selected.length}</b>{" "}
              {selected.length === 1
                ? "carta selecionada"
                : "cartas selecionadas"}{" "}
              · {selectedCopies}{" "}
              {currentList.purpose === "trade" ? "disponíveis" : "cópias"}
            </span>
            <div>
              <button
                className="button secondary"
                onClick={() => setSelected([])}
              >
                Limpar
              </button>
              <button className="button primary" onClick={() => void add()}>
                <Plus size={16} /> Adicionar {selectedCopies} cópias
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
function SearchResult({
  card,
  selected,
  onClick,
  set,
  quantity,
  onQuantityChange,
  isTrade = false,
  salePrice = "",
  onSalePriceChange,
}: {
  card: ApiCard;
  selected: boolean;
  onClick: () => void;
  set?: ApiSet;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  isTrade?: boolean;
  salePrice?: string;
  onSalePriceChange?: (value: string) => void;
}) {
  const total =
    card.set.cardCount?.official ||
    set?.cardCount?.official ||
    card.set.cardCount?.total ||
    set?.cardCount?.total ||
    0;
  const src = imageUrl(card.image);
  return (
    <div className={`search-result-row ${selected ? "selected" : ""}`}>
      <button className="search-result" onClick={onClick}>
        <span className="result-thumb">
          {src ? <img loading="lazy" src={src} alt="" /> : <span>◉</span>}
        </span>
        <span className="result-meta">
          <b>{card.name}</b>
          <span>{card.set.name || set?.name || card.set.id}</span>
        </span>
        <span className="result-num">
          {card.localId} / {total || "—"}
        </span>
        {selected ? (
          <span className="selected-check">
            <Check size={15} />
          </span>
        ) : (
          <span className="select-circle" />
        )}
      </button>
      <div className="card-quantity" aria-label={`Quantidade de ${card.name}`}>
        <button
          type="button"
          aria-label={`Diminuir ${card.name}`}
          onClick={() => onQuantityChange(quantity - 1)}
          disabled={quantity === 0}
        >
          −
        </button>
        <span>{quantity}</span>
        <button
          type="button"
          aria-label={`Aumentar ${card.name}`}
          onClick={() => onQuantityChange(quantity + 1)}
        >
          +
        </button>
      </div>
      {isTrade && (
        <label className="trade-search-price">
          Preço opcional
          <input
            type="text"
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={salePrice ? formatCurrency(Number(salePrice) / 100) : ""}
            onChange={(e) =>
              onSalePriceChange?.(e.target.value.replace(/\D/g, ""))
            }
          />
        </label>
      )}
      {src && <ImageExpand src={src} name={card.name} />}
    </div>
  );
}

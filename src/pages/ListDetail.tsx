import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Download,
  Filter,
  Layers3,
  MessageCircle,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { ListModal } from "./ListsPage";
import { ImageExpand } from "../components/ImagePreview";
import { downloadMissingJpgs, downloadMissingPdf } from "../missing-export";
import {
  acquiredQuantity,
  availableQuantity,
  formatCurrency,
  listLabel,
  missingQuantity,
  now,
  quantity,
  whatsappListText,
} from "../lib/wishlist";
import type { CardStatus, Wishlist, WishlistItem } from "../types";

export function ListDetail({
  lists,
  onSave,
  onDelete,
}: {
  lists: Wishlist[];
  onSave: (x: Wishlist[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { id } = useParams(),
    nav = useNavigate(),
    list = lists.find((x) => x.id === id),
    [filter, setFilter] = useState<"all" | CardStatus>("all"),
    [editing, setEditing] = useState(false),
    [copyToast, setCopyToast] = useState("");
  if (!list)
    return (
      <div className="empty">
        <h3>Lista não encontrada</h3>
        <Link to="/lists">Voltar às listas</Link>
      </div>
    );
  const currentList: Wishlist = list,
    isTrade = list.purpose === "trade";
  const total = list.items.reduce(
      (sum, item) => sum + (isTrade ? availableQuantity(item) : quantity(item)),
      0,
    ),
    items = isTrade
      ? list.items
      : list.items.filter((i) => filter === "all" || i.status === filter),
    got = list.items.reduce((sum, item) => sum + acquiredQuantity(item), 0);
  async function updateItem(item: WishlistItem, patch: Partial<WishlistItem>) {
    const next = {
      ...currentList,
      items: currentList.items.map((i) =>
        i.id === item.id ? { ...i, ...patch, updatedAt: now() } : i,
      ),
      updatedAt: now(),
    };
    await onSave(lists.map((l) => (l.id === id ? next : l)));
  }
  return (
    <>
      <div className="backline">
        <Link to="/lists">
          <ArrowLeft size={16} /> Minhas listas
        </Link>
      </div>
      <div className="detail-head">
        <div>
          <div className="eyebrow">
            {listLabel(list).toUpperCase()} · {total}{" "}
            {isTrade ? "DISPONÍVEIS" : "CARTAS"}
          </div>
          <h1>{list.name}</h1>
          <p>
            {list.description ||
              (isTrade
                ? "Sua vitrine de troca e venda."
                : "Seu objetivo de coleção.")}
          </p>
        </div>
        <div className="detail-actions">
          <MissingExportButtons list={list} />
          <button
            className="button secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(whatsappListText(list));
                setCopyToast("Lista copiada! Cole no WhatsApp ou onde quiser.");
              } catch {
                setCopyToast("Não foi possível copiar automaticamente.");
              }
              window.setTimeout(() => setCopyToast(""), 2800);
            }}
          >
            <MessageCircle size={16} /> Copiar lista
          </button>
          <button className="button secondary" onClick={() => setEditing(true)}>
            Editar lista
          </button>
          <Link className="button primary" to={`/lists/${id}/add`}>
            <Plus size={17} /> Adicionar cartas
          </Link>
        </div>
      </div>
      {copyToast && (
        <div className="copy-toast" role="status">
          {copyToast}
        </div>
      )}
      {!isTrade && (
        <>
          <div className="detail-progress">
            <div>
              <span>PROGRESSO</span>
              <b>
                {got} <small>/ {total} adquiridas</small>
              </b>
            </div>
            <div className="progress-track">
              <i style={{ width: `${total ? (got / total) * 100 : 0}%` }} />
            </div>
            <span>{total ? Math.round((got / total) * 100) : 0}%</span>
          </div>
          <div className="filter-row">
            <div className="tabs">
              {(["all", "wanted", "acquired"] as const).map((f) => (
                <button
                  className={filter === f ? "active" : ""}
                  onClick={() => setFilter(f)}
                  key={f}
                >
                  {f === "all"
                    ? "Todas"
                    : f === "wanted"
                      ? "Desejadas"
                      : "Adquiridas"}{" "}
                  <span>
                    {f === "all"
                      ? total
                      : f === "acquired"
                        ? list.items.reduce(
                            (sum, item) => sum + acquiredQuantity(item),
                            0,
                          )
                        : list.items.reduce(
                            (sum, item) => sum + missingQuantity(item),
                            0,
                          )}
                  </span>
                </button>
              ))}
            </div>
            <button className="text-button">
              <Filter size={15} /> Filtrar
            </button>
          </div>
        </>
      )}
      {items.length ? (
        <div className="card-grid">
          {items.map((i) => (
            <CardTile
              key={i.id}
              item={i}
              isTrade={isTrade}
              onAvailableChange={(value) =>
                void updateItem(i, {
                  availableQuantity: Math.max(
                    0,
                    Math.min(999, Math.floor(value) || 0),
                  ),
                })
              }
              onSalePriceChange={(value) =>
                void updateItem(i, { salePrice: value })
              }
              onDesiredChange={(value) => {
                const desired = Math.max(
                    1,
                    Math.min(999, Math.floor(value) || 1),
                  ),
                  got = Math.min(acquiredQuantity(i), desired);
                void updateItem(i, {
                  quantity: desired,
                  acquiredQuantity: got,
                  status: got >= desired ? "acquired" : "wanted",
                  acquiredAt:
                    got >= desired ? i.acquiredAt || now() : undefined,
                });
              }}
              onAcquiredChange={(value) => {
                const got = Math.max(
                  0,
                  Math.min(quantity(i), Math.floor(value) || 0),
                );
                void updateItem(i, {
                  acquiredQuantity: got,
                  status: got >= quantity(i) ? "acquired" : "wanted",
                  acquiredAt:
                    got >= quantity(i) ? i.acquiredAt || now() : undefined,
                });
              }}
              onRemove={() => {
                if (confirm(`Remover ${i.cardName} desta lista?`))
                  void onSave(
                    lists.map((l) =>
                      l.id === id
                        ? { ...l, items: l.items.filter((x) => x.id !== i.id) }
                        : l,
                    ),
                  );
              }}
            />
          ))}
        </div>
      ) : (
        <div className="empty compact">
          <div className="empty-icon">
            <Layers3 />
          </div>
          <h3>
            {list.items.length
              ? "Nenhuma carta neste filtro"
              : "Sua lista está prontinha para começar"}
          </h3>
          <p>
            Busque uma carta pelo nome, número impresso ou escolha um set
            inteiro.
          </p>
          <Link to={`/lists/${id}/add`} className="button primary">
            <Plus size={16} /> Adicionar cartas
          </Link>
        </div>
      )}
      {editing && (
        <ListModal
          initial={list}
          onClose={() => setEditing(false)}
          onCreate={async (u) => {
            await onSave(lists.map((l) => (l.id === id ? u : l)));
            setEditing(false);
          }}
        />
      )}
      <button
        className="danger-link"
        onClick={() => {
          if (confirm(`Excluir “${list.name}” permanentemente?`)) {
            void onDelete(list.id);
            nav("/lists");
          }
        }}
      >
        <Trash2 size={15} /> Excluir esta lista
      </button>
    </>
  );
}
export function MissingExportButtons({ list }: { list: Wishlist }) {
  const [busy, setBusy] = useState<"pdf" | "jpg" | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    missing =
      list.purpose === "trade"
        ? list.items.filter((item) => availableQuantity(item) > 0)
        : list.items.filter((item) => missingQuantity(item) > 0);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);
  if (!missing.length) return null;
  async function run(format: "pdf" | "jpg") {
    setBusy(format);
    setError("");
    setMessage("");
    try {
      const pages =
        format === "pdf"
          ? await downloadMissingPdf(list)
          : await downloadMissingJpgs(list);
      setMessage(
        format === "pdf"
          ? "PDF gerado e baixado"
          : `${pages} JPG${pages === 1 ? "" : "s"} gerado${pages === 1 ? "" : "s"} e baixado${pages === 1 ? "" : "s"}`,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível exportar as cartas.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <div className="missing-export">
        <div className="missing-export-buttons">
          <button
            className="button secondary"
            disabled={busy !== null}
            onClick={() => void run("pdf")}
          >
            <Download size={15} />
            {busy === "pdf"
              ? "Gerando PDF…"
              : list.purpose === "trade"
                ? "PDF disponíveis"
                : "PDF faltantes"}
          </button>
          <button
            className="button secondary"
            disabled={busy !== null}
            onClick={() => void run("jpg")}
          >
            <ImageIcon size={15} />
            {busy === "jpg"
              ? "Gerando JPG…"
              : list.purpose === "trade"
                ? "JPG disponíveis"
                : "JPG faltantes"}
          </button>
        </div>
        {error && <span className="missing-export-error">{error}</span>}
      </div>
      {message &&
        createPortal(
          <div className="copy-toast" role="status">
            {message}
          </div>,
          document.body,
        )}
    </>
  );
}
export function CardTile({
  item,
  isTrade = false,
  onAvailableChange,
  onSalePriceChange,
  onDesiredChange,
  onAcquiredChange,
  onRemove,
}: {
  item: WishlistItem;
  isTrade?: boolean;
  onAvailableChange?: (quantity: number) => void;
  onSalePriceChange?: (price: number | undefined) => void;
  onDesiredChange: (quantity: number) => void;
  onAcquiredChange: (quantity: number) => void;
  onRemove: () => void;
}) {
  const desired = quantity(item),
    got = acquiredQuantity(item),
    missing = missingQuantity(item),
    complete = missing === 0,
    available = availableQuantity(item);
  return (
    <article className={`card-tile ${complete ? "is-acquired" : ""}`}>
      <div className="tile-image">
        {item.imageUrl ? (
          <>
            <img loading="lazy" src={item.imageUrl} alt={item.cardName} />
            <ImageExpand src={item.imageUrl} name={item.cardName} />
          </>
        ) : (
          <div className="image-placeholder">◉</div>
        )}
      </div>
      <div className="tile-body">
        <div className="tile-number">
          {item.localId} / {item.setOfficialTotal || "—"}
        </div>
        <h3>{item.cardName}</h3>
        <p>{item.setName}</p>
        {isTrade ? (
          <>
            <div className="card-quantity-editors">
              <div className="card-quantity-line">
                <span>Disponíveis</span>
                <div>
                  <button
                    type="button"
                    aria-label={`Diminuir quantidade disponível de ${item.cardName}`}
                    disabled={available <= 0}
                    onClick={() => onAvailableChange?.(available - 1)}
                  >
                    −
                  </button>
                  <b>{available}</b>
                  <button
                    type="button"
                    aria-label={`Aumentar quantidade disponível de ${item.cardName}`}
                    onClick={() => onAvailableChange?.(available + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <label className="trade-price-control">
              Preço de venda · opcional
              <input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={
                  item.salePrice === undefined
                    ? ""
                    : formatCurrency(item.salePrice)
                }
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  onSalePriceChange?.(
                    digits ? Number(digits) / 100 : undefined,
                  );
                }}
              />
            </label>
          </>
        ) : (
          <>
            <div className="card-quantity-editors">
              <div className="card-quantity-line">
                <span>Desejadas</span>
                <div>
                  <button
                    type="button"
                    aria-label={`Diminuir quantidade desejada de ${item.cardName}`}
                    disabled={desired <= 1}
                    onClick={() => onDesiredChange(desired - 1)}
                  >
                    −
                  </button>
                  <b>{desired}</b>
                  <button
                    type="button"
                    aria-label={`Aumentar quantidade desejada de ${item.cardName}`}
                    onClick={() => onDesiredChange(desired + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="card-quantity-line">
                <span>Conseguidas</span>
                <div>
                  <button
                    type="button"
                    aria-label={`Diminuir quantidade conseguida de ${item.cardName}`}
                    disabled={got <= 0}
                    onClick={() => onAcquiredChange(got - 1)}
                  >
                    −
                  </button>
                  <b>{got}</b>
                  <button
                    type="button"
                    aria-label={`Aumentar quantidade conseguida de ${item.cardName}`}
                    disabled={got >= desired}
                    onClick={() => onAcquiredChange(got + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        <div className="tile-footer">
          {isTrade ? (
            <span className="status-pill trade-status">
              {available} disponíveis
            </span>
          ) : (
            <>
              <span
                className={`status-pill ${complete ? "acquired" : "wanted"}`}
              >
                {complete ? "Concluída" : `Faltam ${missing}`}
              </span>
              {!complete && (
                <button
                  type="button"
                  className="mark-card-acquired"
                  onClick={() => onAcquiredChange(desired)}
                >
                  <Check size={13} /> Consegui todas
                </button>
              )}
            </>
          )}
          <button
            className="remove-card"
            onClick={onRemove}
            title="Remover carta"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layers3, Plus, Search, Trash2, X } from "lucide-react";
import { EmptyLists, ListCard } from "./Dashboard";
import { labels, now, uid } from "../lib/wishlist";
import { imageUrl, searchCards } from "../tcgdex";
import type { ApiCardSummary, ListType, Wishlist } from "../types";

export function ListsPage({
  lists,
  onSave,
  onDelete,
}: {
  lists: Wishlist[];
  onSave: (x: Wishlist[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [modal, setModal] = useState(false),
    [query, setQuery] = useState(""),
    [saveError, setSaveError] = useState(""),
    route = useLocation(),
    nav = useNavigate();
  useEffect(() => {
    if (new URLSearchParams(route.search).get("new") === "1") {
      setModal(true);
      nav("/lists", { replace: true });
    }
  }, [route.search, nav]);
  const filtered = lists.filter((l) =>
    l.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">SEUS OBJETIVOS</div>
          <h1>Minhas listas</h1>
          <p>Um lugar para cada coleção que você sonha completar.</p>
        </div>
        <button className="button primary" onClick={() => setModal(true)}>
          <Plus size={17} /> Nova lista
        </button>
      </div>
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            placeholder="Buscar lista..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="result-count">
          {filtered.length} {filtered.length === 1 ? "lista" : "listas"}
        </span>
      </div>
      {filtered.length ? (
        <div className="list-grid">
          {filtered.map((l) => (
            <div className="list-wrap" key={l.id}>
              <ListCard list={l} />
              <button
                className="delete-list"
                title="Excluir lista"
                onClick={() => {
                  if (
                    confirm(
                      `Excluir a lista “${l.name}” e todas as cartas dela?`,
                    )
                  )
                    void onDelete(l.id);
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <EmptyLists />
      )}
      {saveError && <p className="error-box" role="alert">{saveError}</p>}
      {modal && (
        <ListModal
          onClose={() => setModal(false)}
          onCreate={async (l) => {
            try {
              setSaveError("");
              await onSave([...lists, l]);
              setModal(false);
            } catch {
              setSaveError("Não foi possível salvar a lista no servidor. Confira a conexão e tente novamente.");
            }
          }}
        />
      )}
    </>
  );
}
export function ListModal({
  onClose,
  onCreate,
  initial,
}: {
  onClose: () => void;
  onCreate: (l: Wishlist) => void;
  initial?: Wishlist;
}) {
  const [name, setName] = useState(initial?.name || ""),
    [description, setDesc] = useState(initial?.description || ""),
    [type, setType] = useState<ListType>(initial?.type || "collection"),
    [purpose, setPurpose] = useState<"collection" | "trade">(
      initial?.purpose || "collection",
    ),
    [coverColor, setCoverColor] = useState(initial?.coverColor || "#2563eb"),
    [coverImage, setCoverImage] = useState(initial?.coverImage || ""),
    [coverPosition, setCoverPosition] = useState(
      initial?.coverPosition || "center 50%",
    ),
    [coverSource, setCoverSource] = useState<"photo" | "card">(
      initial?.coverSource ||
        (initial?.coverImage?.startsWith("data:") ? "photo" : "card"),
    ),
    [coverMode, setCoverMode] = useState<"color" | "photo" | "card">(
      initial?.coverImage
        ? initial.coverSource === "photo" ||
          initial.coverImage.startsWith("data:")
          ? "photo"
          : "card"
        : "color",
    ),
    [coverQuery, setCoverQuery] = useState(""),
    [coverResults, setCoverResults] = useState<ApiCardSummary[]>([]),
    [searchingCards, setSearchingCards] = useState(false),
    [coverError, setCoverError] = useState("");
  const colors = [
    "#2563eb",
    "#e11d48",
    "#16a34a",
    "#f97316",
    "#7c3aed",
    "#0891b2",
    "#facc15",
    "#334155",
  ];
  useEffect(() => {
    if (coverMode !== "card" || coverQuery.trim().length < 2) {
      setCoverResults([]);
      setSearchingCards(false);
      return;
    }
    const controller = new AbortController(),
      timer = setTimeout(async () => {
        setSearchingCards(true);
        try {
          setCoverResults(await searchCards(coverQuery, controller.signal));
        } catch {
          if (!controller.signal.aborted) setCoverResults([]);
        } finally {
          if (!controller.signal.aborted) setSearchingCards(false);
        }
      }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [coverQuery, coverMode]);
  function chooseImage(file?: File) {
    setCoverError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCoverError("Escolha um arquivo de imagem.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setCoverError("A imagem deve ter no máximo 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 900 / Math.max(img.width, img.height)),
          canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas
          .getContext("2d")
          ?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setCoverImage(canvas.toDataURL("image/jpeg", 0.82));
        setCoverSource("photo");
        setCoverMode("photo");
        setCoverPosition("center 50%");
      };
      img.onerror = () => setCoverError("Não foi possível abrir essa imagem.");
      img.src = String(reader.result);
    };
    reader.onerror = () => setCoverError("Não foi possível ler essa imagem.");
    reader.readAsDataURL(file);
  }
  function selectCard(card: ApiCardSummary) {
    const image = imageUrl(card.image);
    if (!image) {
      setCoverError("Essa carta não tem imagem disponível.");
      return;
    }
    setCoverImage(image);
    setCoverSource("card");
    setCoverMode("card");
    setCoverPosition("center 15%");
    setCoverError("");
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form
        className="modal list-modal"
        onSubmit={(e) => {
          e.preventDefault();
          const t = now();
          onCreate({
            ...initial,
            id: initial?.id || uid(),
            name: name.trim(),
            description: description.trim(),
            purpose,
            type,
            coverColor,
            coverImage,
            coverPosition,
            coverSource,
            createdAt: initial?.createdAt || t,
            updatedAt: t,
            items: initial?.items || [],
          });
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" type="button" onClick={onClose}>
          <X />
        </button>
        <div className="eyebrow">
          {initial ? "PERSONALIZAR LISTA" : "NOVO OBJETIVO"}
        </div>
        <h2>{initial ? "Editar capa da lista" : "Vamos começar uma lista"}</h2>
        <p className="modal-lead">
          Escolha uma foto, uma carta ou uma cor para sua coleção.
        </p>
        <label>
          Nome da lista
          <input
            autoFocus
            required
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Completar set 151"
          />
        </label>
        <label>
          Descrição <span className="optional">OPCIONAL</span>
          <textarea
            maxLength={180}
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="O que você quer colecionar?"
          />
        </label>
        <label>Tipo principal</label>
        <div className="type-options purpose-options">
          <button
            type="button"
            className={purpose === "collection" ? "selected" : ""}
            onClick={() => setPurpose("collection")}
          >
            <span>▦</span>Coleção
          </button>
          <button
            type="button"
            className={purpose === "trade" ? "selected" : ""}
            onClick={() => setPurpose("trade")}
          >
            <span>↔</span>Troca/Venda
          </button>
        </div>
        {purpose === "collection" && (
          <>
            <label>Objetivo da coleção</label>
            <div className="type-options">
              {(["collection", "pokemon", "theme"] as ListType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  className={type === t ? "selected" : ""}
                  onClick={() => setType(t)}
                >
                  <span>
                    {t === "collection" ? "▦" : t === "pokemon" ? "◉" : "✦"}
                  </span>
                  {labels[t]}
                </button>
              ))}
            </div>
          </>
        )}
        <label>Capa da coleção</label>
        <div className="cover-mode-tabs">
          <button
            type="button"
            className={coverMode === "color" ? "active" : ""}
            onClick={() => {
              setCoverMode("color");
              setCoverImage("");
            }}
          >
            Cor
          </button>
          <button
            type="button"
            className={coverMode === "photo" ? "active" : ""}
            onClick={() => setCoverMode("photo")}
          >
            Foto
          </button>
          <button
            type="button"
            className={coverMode === "card" ? "active" : ""}
            onClick={() => setCoverMode("card")}
          >
            Carta Pokémon
          </button>
        </div>
        {coverMode === "card" && (
          <div className="cover-card-picker">
            <div className="search-box">
              <Search size={15} />
              <input
                value={coverQuery}
                onChange={(e) => setCoverQuery(e.target.value)}
                placeholder="Buscar carta ou Pokémon..."
              />
            </div>
            {searchingCards && <p className="helper">Buscando cartas...</p>}
            {coverQuery.trim().length >= 2 &&
              !searchingCards &&
              !coverResults.length && (
                <p className="helper">Nenhuma carta encontrada.</p>
              )}
            {coverResults.length > 0 && (
              <>
                <p className="helper">
                  {coverResults.length} cartas encontradas · role para ver todas
                </p>
                <div className="cover-card-results">
                  {coverResults.map((card) => (
                    <button
                      type="button"
                      key={card.id}
                      className={`cover-card-option ${coverImage === imageUrl(card.image) ? "selected" : ""}`}
                      onClick={() => selectCard(card)}
                      title={card.name}
                    >
                      {card.image ? (
                        <img
                          src={imageUrl(card.image) || ""}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <span>◉</span>
                      )}
                      <span>{card.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {coverMode === "photo" && (
          <label className="button secondary cover-upload">
            <Plus size={15} />
            {coverSource === "photo" && coverImage
              ? "Trocar foto"
              : "Enviar foto"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => chooseImage(e.target.files?.[0])}
            />
          </label>
        )}
        {coverMode === "color" && (
          <div className="cover-swatches" aria-label="Escolher cor da capa">
            {colors.map((color) => (
              <button
                type="button"
                key={color}
                className={`cover-swatch ${coverColor === color ? "active" : ""}`}
                style={{ background: color }}
                aria-label={`Usar cor ${color}`}
                title={color}
                onClick={() => setCoverColor(color)}
              />
            ))}
            <label
              className="custom-color"
              title="Escolher outra cor"
              style={{ background: coverColor }}
            >
              <input
                type="color"
                value={coverColor}
                onChange={(e) => setCoverColor(e.target.value)}
                aria-label="Escolher outra cor"
              />
            </label>
          </div>
        )}
        <div className="cover-editor">
          <div
            className="cover-preview"
            style={{
              background: coverImage
                ? `no-repeat center/${coverSource === "card" ? "cover" : "cover"} url("${coverImage}")`
                : coverColor,
              backgroundPosition: coverPosition,
            }}
          >
            {!coverImage && <Layers3 size={27} />}
            <span>{name || "Prévia da capa"}</span>
          </div>
          <div className="cover-options">
            {coverImage && (
              <label className="cover-crop-control">
                Ajustar recorte da carta
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Number(coverPosition.match(/(\d+)%/)?.[1] || 50)}
                  onChange={(e) =>
                    setCoverPosition(`center ${e.target.value}%`)
                  }
                />
                <span>
                  Topo <span>Base</span>
                </span>
              </label>
            )}
            {coverMode !== "color" && (
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setCoverImage("");
                  setCoverMode("color");
                }}
              >
                Usar somente uma cor
              </button>
            )}
          </div>
        </div>
        {coverError && <p className="cover-error">{coverError}</p>}
        {coverMode === "photo" && (
          <p className="helper">
            Imagens de até 3 MB; serão reduzidas para caber na capa.
          </p>
        )}
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit">
            <Plus size={16} />
            {initial ? "Salvar alterações" : "Criar lista"}
          </button>
        </div>
      </form>
    </div>
  );
}

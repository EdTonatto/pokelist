import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  FolderHeart,
  Heart,
  Layers3,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  acquiredQuantity,
  availableQuantity,
  listLabel,
  quantity,
} from "../lib/wishlist";
import type { Wishlist } from "../types";

export function Dashboard({ lists }: { lists: Wishlist[] }) {
  const count = lists.reduce(
      (n, l) =>
        n +
        l.items.reduce(
          (sum, item) =>
            sum +
            (l.purpose === "trade" ? availableQuantity(item) : quantity(item)),
          0,
        ),
      0,
    ),
    collectionCount = lists.reduce(
      (n, l) =>
        n +
        (l.purpose === "trade"
          ? 0
          : l.items.reduce((sum, item) => sum + quantity(item), 0)),
      0,
    ),
    got = lists.reduce(
      (n, l) =>
        n +
        (l.purpose === "trade"
          ? 0
          : l.items.reduce((sum, item) => sum + acquiredQuantity(item), 0)),
      0,
    );
  return (
    <>
      <div className="welcome">
        <div>
          <div className="eyebrow">
            <Sparkles size={14} /> SEU ESPAÇO DE COLECIONADOR
          </div>
          <h1>
            Sua coleção,
            <br />
            <em>do seu jeito.</em>
          </h1>
          <p>
            Organize seus objetivos, acompanhe suas cartas e celebre cada
            conquista.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/lists?new=1">
              <Plus size={17} /> Criar nova lista
            </Link>
            <Link className="button secondary" to="/lists">
              <FolderHeart size={17} /> Ver minhas listas
            </Link>
          </div>
        </div>
        <div className="hero-art">
          <div className="sun" />
          <div className="hero-card">
            <span className="card-shine">✦</span>
            <span className="hero-pokeball">◉</span>
            <span className="hero-caption">
              YOUR NEXT
              <br />
              FAVORITE CARD
            </span>
          </div>
          <span className="float-tag">✦ coleção em progresso</span>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Seu progresso</h2>
          <p>Um pouquinho mais perto a cada carta.</p>
        </div>
        <Link to="/lists" className="text-link">
          Ver todas <ChevronRight size={16} />
        </Link>
      </div>
      <div className="stats-grid">
        <Stat
          icon={<FolderHeart />}
          label="LISTAS CRIADAS"
          value={lists.length}
          foot="objetivos ativos"
          tone="lavender"
        />
        <Stat
          icon={<Layers3 />}
          label="CARTAS NA LISTA"
          value={count}
          foot="cartas organizadas"
          tone="peach"
        />
        <Stat
          icon={<Check />}
          label="CARTAS ADQUIRIDAS"
          value={got}
          foot={
            collectionCount
              ? `${Math.round((got / collectionCount) * 100)}% da sua coleção`
              : "cada conquista conta"
          }
          tone="mint"
        />
        <div className="progress-card">
          <div className="stat-label">PROGRESSO GERAL</div>
          <div className="progress-numbers">
            <strong>
              {collectionCount ? Math.round((got / collectionCount) * 100) : 0}%
            </strong>
            <span>
              {got} de {collectionCount} cartas
            </span>
          </div>
          <div className="progress-track">
            <i
              style={{
                width: `${collectionCount ? (got / collectionCount) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="progress-foot">
            Continue assim! <Heart size={14} />
          </div>
        </div>
      </div>
      <div className="section-heading list-head">
        <div>
          <h2>Suas listas</h2>
          <p>Seus objetivos em um só lugar.</p>
        </div>
        <Link className="text-link" to="/lists">
          Todas as listas <ChevronRight size={16} />
        </Link>
      </div>
      {lists.length ? (
        <div className="list-grid">
          {lists.slice(0, 3).map((l) => (
            <ListCard key={l.id} list={l} />
          ))}
        </div>
      ) : (
        <EmptyLists />
      )}
      <div className="tip">
        <span>✦</span>
        <p>
          <b>Dica de colecionador</b>
          <br />
          Seus dados ficam guardados somente neste navegador. Exporte um backup
          para não perder sua coleção.
        </p>
        <Link to="/settings/data">
          Fazer backup <ChevronRight size={15} />
        </Link>
      </div>
    </>
  );
}
export function Stat({
  icon,
  label,
  value,
  foot,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  foot: string;
  tone: string;
}) {
  return (
    <div className="stat-card">
      <span className={`stat-icon ${tone}`}>{icon}</span>
      <div className="stat-label">{label}</div>
      <strong className="stat-value">{value}</strong>
      <div className="stat-foot">{foot}</div>
    </div>
  );
}
export function EmptyLists() {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FolderHeart size={24} />
      </div>
      <h3>Um espaço esperando suas ideias</h3>
      <p>
        Crie sua primeira lista para acompanhar sets, Pokémon ou qualquer tema
        da sua coleção.
      </p>
      <Link to="/lists?new=1" className="button primary">
        <Plus size={16} /> Criar minha primeira lista
      </Link>
    </div>
  );
}
export function ListCard({ list }: { list: Wishlist }) {
  const isTrade = list.purpose === "trade",
    total = list.items.reduce(
      (sum, item) => sum + (isTrade ? availableQuantity(item) : quantity(item)),
      0,
    ),
    got = isTrade
      ? 0
      : list.items.reduce((sum, item) => sum + acquiredQuantity(item), 0);
  return (
    <Link className="list-card" to={`/lists/${list.id}`}>
      <div
        className="list-cover"
        style={{
          background: list.coverImage
            ? `no-repeat center/${list.coverImage ? "cover" : "auto"} url("${list.coverImage}")`
            : list.coverColor || undefined,
          backgroundPosition: list.coverPosition || "center",
        }}
      >
        {!list.coverImage && <div className="cover-shape">◉</div>}
        <span>{listLabel(list)}</span>
      </div>
      <div className="list-info">
        <h3>{list.name}</h3>
        <p>
          {list.description ||
            `${total} ${isTrade ? "cartas disponíveis" : "cartas na lista"}`}
        </p>
        {isTrade ? (
          <div className="trade-summary">{total} disponíveis</div>
        ) : (
          <div className="mini-progress">
            <div className="progress-track">
              <i style={{ width: `${total ? (got / total) * 100 : 0}%` }} />
            </div>
            <span>
              {got}/{total}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

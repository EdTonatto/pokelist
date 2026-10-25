import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Archive,
  CircleHelp,
  FolderHeart,
  Layers3,
  MessageCircle,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
import { pokemonThemes, type PokemonThemeId } from "./theme/pokemon-themes";
import { Dashboard } from "./pages/Dashboard";
import { ListDetail } from "./pages/ListDetail";
import { AddCards } from "./pages/AddCards";
import { DataPage } from "./pages/DataPage";
import { ListsPage } from "./pages/ListsPage";
import { LandingPage } from "./pages/LandingPage";
import { AppearancePage } from "./pages/AppearancePage";
import { FeedbackPage } from "./pages/FeedbackPage";
import { deleteList, getLists, getLegacyLists, saveList } from "./db";
import type { Wishlist } from "./types";
import { AuthPage } from "./pages/AuthPage";
import { usePokeListAuth } from "./lib/auth";
function App() {
  const auth = usePokeListAuth(),
    route = useLocation(),
    navigate = useNavigate(),
    [lists, setLists] = useState<Wishlist[]>([]),
    [ready, setReady] = useState(false),
    [syncError, setSyncError] = useState(""),
    [legacyCount, setLegacyCount] = useState(0),
    [importingLegacy, setImportingLegacy] = useState(false),
    [theme, setTheme] = useState<"light" | "dark">(() =>
      localStorage.getItem("pokelist-theme") === "dark" ? "dark" : "light",
    ),
    [pokemonTheme, setPokemonTheme] = useState<PokemonThemeId>(() => {
      const saved = localStorage.getItem("pokelist-color-theme");
      return (
        pokemonThemes.find((option) => option.id === saved)?.id ||
        pokemonThemes[0].id
      );
    });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("pokelist-theme", theme);
  }, [theme]);
  useEffect(() => {
    const selected =
        pokemonThemes.find((option) => option.id === pokemonTheme) ||
        pokemonThemes[0],
      root = document.documentElement;
    root.dataset.pokemonTheme = pokemonTheme;
    root.style.setProperty("--pokemon-accent", selected.accent);
    root.style.setProperty("--pokemon-accent-strong", selected.strong);
    root.style.setProperty("--pokemon-accent-soft", selected.soft);
    root.style.setProperty("--pokemon-accent-line", selected.line);
    root.style.setProperty("--pokemon-accent-text", selected.text);
    root.style.setProperty("--pokemon-accent-soft-dark", selected.softDark);
    root.style.setProperty("--pokemon-accent-text-dark", selected.textDark);
    localStorage.setItem("pokelist-color-theme", pokemonTheme);
  }, [pokemonTheme]);
  useEffect(() => {
    if (auth.loading || !auth.user) {
      setLists([]);
      setReady(false);
      return;
    }
    let active = true;
    setSyncError("");
    void getLegacyLists().then(old => { if (active) setLegacyCount(old.length); }).catch(() => {});
    getLists()
      .then((items) => {
        if (active) setLists(items);
      })
      .catch(() => {
        if (active) { setLists([]); setSyncError("Não foi possível carregar suas listas salvas. Tente atualizar a página."); }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => { active = false; };
  }, [auth.loading, auth.user?.id]);
  async function persist(next: Wishlist[]) {
    await Promise.all(next.map(saveList));
    setLists(next);
  }
  async function remove(id: string) {
    await deleteList(id);
    setLists((v) => v.filter((x) => x.id !== id));
  }
  async function importLegacy() {
    setImportingLegacy(true);
    try {
      const old = await getLegacyLists();
      for (const list of old) await saveList(list);
      setLists(await getLists());
      setLegacyCount(0);
    } catch {
      setSyncError("Falha ao importar listas antigas. Elas continuam preservadas neste navegador.");
    } finally {
      setImportingLegacy(false);
    }
  }
  async function handleLogout() {
    try {
      await auth.logout();
    } catch {
      // Local credentials are removed by logout even if the API is unreachable.
    } finally {
      setLists([]);
      setReady(false);
      navigate("/", { replace: true });
    }
  }
  if (auth.loading) {
    return <div className="loading">Verificando sessão…</div>;
  }
  if (route.pathname.startsWith("/auth/")) {
    return <AuthPage auth={auth} />;
  }
  if (route.pathname !== "/" && !auth.user) {
    return <Navigate to="/auth/login" replace />;
  }
  return route.pathname === "/" ? (
    <LandingPage
      theme={theme}
      onToggleTheme={() =>
        setTheme((value) => (value === "light" ? "dark" : "light"))
      }
    />
  ) : (
    <div className="app">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">◉</span>
          <span>
            pokélist<small>TCG COLLECTION</small>
          </span>
        </Link>
        <div className="side-label">MENU</div>
        <nav>
          <NavLink to="/dashboard">
            <Layers3 size={18} /> Visão geral
          </NavLink>
          <NavLink to="/lists">
            <FolderHeart size={18} /> Minhas listas{" "}
            <span className="nav-count">{lists.length}</span>
          </NavLink>
          <NavLink to="/settings/appearance">
            <Sparkles size={18} /> Aparência
          </NavLink>
          <NavLink to="/settings/data">
            <Archive size={18} /> Dados e backup
          </NavLink>
          <NavLink to="/feedback">
            <MessageCircle size={18} /> Sugestões
          </NavLink>
        </nav>
        <div className="side-bottom">
          <div className="backup-note">
            <ShieldCheck size={17} />
            <p>
              Suas listas ficam salvas na sua conta.
              <br />
              <b>Disponíveis ao entrar em outro dispositivo.</b>
            </p>
          </div>
          <span className="version">POKÉLIST · MVP 1.0</span>
          <div className="backup-note">
            <p>{auth.user
              ? "Conta conectada. Suas listas são armazenadas no banco de dados."
              : "Entre para acessar suas listas armazenadas na nuvem."}</p>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="crumb">
            MINHA COLEÇÃO <span>/</span>{" "}
            {location.hash.includes("settings")
              ? "DADOS E BACKUP"
              : location.hash.includes("lists")
                ? "MINHAS LISTAS"
                : "VISÃO GERAL"}
          </div>
          <div className="top-actions">
            <span className="local-badge">
              <i /> Sincronizado com a conta
            </span>
            {auth.user ? (
              <button type="button" className="theme-toggle" onClick={() => void handleLogout()}
                title="Encerrar sessão da conta PokeList">
                Sair · {auth.user.displayName}
              </button>
            ) : (
              <Link className="theme-toggle" to="/auth/login">Entrar / Criar conta</Link>
            )}
            <button
              type="button"
              className="theme-toggle"
              onClick={() =>
                setTheme((value) => (value === "light" ? "dark" : "light"))
              }
              aria-label={
                theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"
              }
              title={
                theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"
              }
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
              <span>{theme === "light" ? "Escuro" : "Claro"}</span>
            </button>
            <Link
              className="icon-button"
              to="/settings/data"
              aria-label="Ajuda e backup"
            >
              <CircleHelp size={19} />
            </Link>
          </div>
        </header>
        <section className="content">
          {ready && legacyCount > 0 && !syncError && (
            <div className="backup-note" role="status">
              <p>Encontramos {legacyCount} lista(s) antiga(s) neste navegador. Elas ainda não estão na nuvem. Importe-as para esta conta quando quiser.</p>
              <button type="button" className="button secondary" disabled={importingLegacy} onClick={() => void importLegacy()}>
                {importingLegacy ? "Importando…" : "Importar minhas listas antigas"}
              </button>
            </div>
          )}
          {!ready ? (
            <div className="loading">Preparando sua coleção…</div>
          ) : syncError ? (
            <div role="alert" className="loading">{syncError}</div>
          ) : (
            <Routes>
              <Route path="/dashboard" element={<Dashboard lists={lists} />} />
              <Route
                path="/lists"
                element={
                  <ListsPage lists={lists} onSave={persist} onDelete={remove} />
                }
              />
              <Route
                path="/lists/:id"
                element={
                  <ListDetail
                    lists={lists}
                    onSave={persist}
                    onDelete={remove}
                  />
                }
              />
              <Route
                path="/lists/:id/add"
                element={<AddCards lists={lists} onSave={persist} />}
              />
              <Route
                path="/settings/data"
                element={
                  <DataPage
                    lists={lists}
                    onImport={async (x) => {
                      const existing = await getLists();
                      const taken = new Set(existing.map(list => list.id));
                      const imported = x.map(list => {
                        const id = taken.has(list.id) ? crypto.randomUUID() : list.id;
                        taken.add(id);
                        return {
                          ...list,
                          id,
                          items: list.items.map(item => ({
                            ...item,
                            wishlistId: id,
                          })),
                        };
                      });
                      for (const list of imported) await saveList(list);
                      setLists(await getLists());
                    }}
                  />
                }
              />
              <Route
                path="/settings/appearance"
                element={
                  <AppearancePage
                    theme={theme}
                    onToggleTheme={() =>
                      setTheme((value) =>
                        value === "light" ? "dark" : "light",
                      )
                    }
                    pokemonTheme={pokemonTheme}
                    onPokemonThemeChange={setPokemonTheme}
                  />
                }
              />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="*" element={<Dashboard lists={lists} />} />
            </Routes>
          )}
        </section>
      </main>
    </div>
  );
}
export default App;

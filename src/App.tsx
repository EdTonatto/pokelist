import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
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
import { deleteList, getLists, replaceLists, saveList } from "./db";
import type { Wishlist } from "./types";
import { AuthPage } from "./pages/AuthPage";
import { usePokeListAuth } from "./lib/auth";
function App() {
  const auth = usePokeListAuth(),
    route = useLocation(),
    [lists, setLists] = useState<Wishlist[]>([]),
    [ready, setReady] = useState(false),
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
    getLists()
      .then((x) => {
        setLists(x);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);
  async function persist(next: Wishlist[]) {
    setLists(next);
    await Promise.all(next.map(saveList));
  }
  async function remove(id: string) {
    await deleteList(id);
    setLists((v) => v.filter((x) => x.id !== id));
  }
  if (route.pathname.startsWith("/auth/")) {
    return <AuthPage auth={auth} />;
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
              Suas listas continuam neste dispositivo.
              <br />
              <b>Faça backups regularmente.</b>
            </p>
          </div>
          <span className="version">POKÉLIST · MVP 1.0</span>
          <div className="backup-note">
            <p>{auth.user
              ? "Conta conectada. As listas locais ainda não são sincronizadas com a nuvem."
              : "Entre para usar uma conta PokeList; suas listas atuais permanecem locais."}</p>
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
              <i /> Armazenamento local
            </span>
            {auth.user ? (
              <button type="button" className="theme-toggle" onClick={() => void auth.logout()}
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
          {!ready ? (
            <div className="loading">Preparando sua coleção…</div>
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
                      await replaceLists(x);
                      setLists(x);
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

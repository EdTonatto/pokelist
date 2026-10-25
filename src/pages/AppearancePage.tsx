import { Check, Moon, Sun } from "lucide-react";
import { pokemonThemes, type PokemonThemeId } from "../theme/pokemon-themes";
export function AppearancePage({
  theme,
  onToggleTheme,
  pokemonTheme,
  onPokemonThemeChange,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  pokemonTheme: PokemonThemeId;
  onPokemonThemeChange: (theme: PokemonThemeId) => void;
}) {
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">PERSONALIZE O POKÉLIST</div>
          <h1>Aparência</h1>
          <p>
            Escolha uma paleta inspirada em Pokémon e alterne entre o modo claro
            e escuro.
          </p>
        </div>
      </div>
      <section className="appearance-mode-card">
        <div>
          <span className="appearance-mode-icon">
            {theme === "light" ? <Sun size={19} /> : <Moon size={19} />}
          </span>
          <div>
            <b>Modo {theme === "light" ? "claro" : "escuro"}</b>
            <small>
              {theme === "light"
                ? "Interface clara para ambientes iluminados"
                : "Interface escura para ambientes com pouca luz"}
            </small>
          </div>
        </div>
        <button className="button secondary" onClick={onToggleTheme}>
          {theme === "light" ? "Ativar modo escuro" : "Ativar modo claro"}
        </button>
      </section>
      <div className="appearance-heading">
        <div>
          <div className="eyebrow">8 PALETAS</div>
          <h2>Temas Pokémon</h2>
          <p>A cor escolhida é salva neste navegador.</p>
        </div>
      </div>
      <div className="pokemon-theme-grid">
        {pokemonThemes.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`pokemon-theme-card ${pokemonTheme === option.id ? "selected" : ""}`}
            style={
              {
                "--theme-accent": option.accent,
                "--theme-soft": option.soft,
                "--theme-line": option.line,
              } as React.CSSProperties
            }
            aria-pressed={pokemonTheme === option.id}
            onClick={() => onPokemonThemeChange(option.id)}
          >
            <span className="pokemon-theme-swatch">
              <i />
              <i />
              <i />
            </span>
            <span className="pokemon-theme-copy">
              <b>{option.name}</b>
              <small>{option.description}</small>
            </span>
            {pokemonTheme === option.id && (
              <Check size={17} className="pokemon-theme-check" />
            )}
          </button>
        ))}
      </div>
    </>
  );
}

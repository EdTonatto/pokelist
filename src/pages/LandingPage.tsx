import { Link } from "react-router-dom";
import {
  Check,
  ChevronRight,
  Download,
  FolderHeart,
  Heart,
  Layers3,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";
export function LandingPage({
  theme,
  onToggleTheme,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
}) {
  function scrollTo(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">◉</span>
          <span>
            pokélist<small>TCG COLLECTION</small>
          </span>
        </Link>
        <nav aria-label="Navegação da página">
          <button type="button" onClick={() => scrollTo("recursos")}>
            Recursos
          </button>
          <button type="button" onClick={() => scrollTo("como-funciona")}>
            Como funciona
          </button>
        </nav>
        <button
          type="button"
          className="landing-theme"
          onClick={onToggleTheme}
          aria-label={
            theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"
          }
          title={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
        >
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <Link to="/auth/login" className="landing-login">
          Entrar / Criar conta <ChevronRight size={15} />
        </Link>
      </header>
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="eyebrow">
            <Sparkles size={14} /> PARA QUEM COLECIONA POKÉMON TCG
          </div>
          <h1>
            Suas cartas.
            <br />
            <em>Sua coleção.</em>
            <br />
            Do seu jeito.
          </h1>
          <p>
            Organize sets, acompanhe cada carta que falta e veja sua coleção
            ganhar forma — uma carta de cada vez.
          </p>
          <div className="landing-hero-actions">
            <Link to="/lists?new=1" className="button primary">
              Criar minha primeira lista <ChevronRight size={17} />
            </Link>
            <button
              type="button"
              className="button secondary"
              onClick={() => scrollTo("recursos")}
            >
              Conhecer recursos
            </button>
          </div>
          <div className="landing-trust">
            <ShieldCheck size={16} />
            <span>Use sem conta ou crie uma conta. Suas listas atuais ficam neste dispositivo.</span>
          </div>
        </div>
        <div
          className="landing-visual"
          aria-label="Prévia de uma lista de coleção"
        >
          <div className="landing-glow" />
          <div className="landing-preview-card landing-preview-back">◉</div>
          <div className="landing-preview-card landing-preview-front">
            <div className="preview-card-top">
              <span>MINHA COLEÇÃO</span>
              <b>✦</b>
            </div>
            <div className="preview-art">◉</div>
            <div className="preview-card-info">
              <strong>Pokémon favoritos</strong>
              <span>Set 151 · 64 de 165 cartas</span>
              <div className="progress-track">
                <i style={{ width: "39%" }} />
              </div>
              <div className="preview-progress">
                <b>39%</b>
                <span>101 cartas faltando</span>
              </div>
            </div>
          </div>
          <div className="landing-floating-note">
            <span>
              <Check size={14} />
            </span>{" "}
            Mais uma carta conquistada!
          </div>
        </div>
      </section>
      <section className="landing-proof">
        <span>FEITO PARA A SUA ROTINA DE COLECIONADOR</span>
        <div>
          <b>Sets físicos</b>
          <i />
          <b>Progresso por carta</b>
          <i />
          <b>Trocas e vendas</b>
          <i />
          <b>Exportação fácil</b>
        </div>
      </section>
      <section id="recursos" className="landing-section landing-features">
        <div className="landing-section-heading">
          <div className="eyebrow">UM LUGAR PARA CADA OBJETIVO</div>
          <h2>
            Organize a coleção.
            <br />
            <em>Curta o caminho.</em>
          </h2>
          <p>
            Da busca da próxima carta até a lista pronta para compartilhar, tudo
            fica em um só lugar.
          </p>
        </div>
        <div className="feature-grid">
          <article className="feature-card feature-card-highlight">
            <span className="feature-icon lavender">
              <Layers3 size={19} />
            </span>
            <h3>Acompanhe cada carta</h3>
            <p>
              Monte listas por set, Pokémon ou tema. Registre quantas cópias
              quer e marque quantas já conseguiu.
            </p>
            <span className="feature-detail">
              <Check size={14} /> Progresso que acompanha suas quantidades
            </span>
          </article>
          <article className="feature-card">
            <span className="feature-icon peach">
              <FolderHeart size={19} />
            </span>
            <h3>Crie sua vitrine</h3>
            <p>
              Separe cartas para troca ou venda, informe quantas estão
              disponíveis e adicione o preço quando quiser.
            </p>
            <span className="feature-detail">
              <Check size={14} /> Quantidade e valor por carta
            </span>
          </article>
          <article className="feature-card">
            <span className="feature-icon mint">
              <Download size={19} />
            </span>
            <h3>Compartilhe do seu jeito</h3>
            <p>
              Copie uma relação para o WhatsApp ou gere JPG e PDF com as imagens
              completas das cartas.
            </p>
            <span className="feature-detail">
              <Check size={14} /> Arquivos em grade 3 × 3
            </span>
          </article>
          <article className="feature-card">
            <span className="feature-icon lavender">
              <ShieldCheck size={19} />
            </span>
            <h3>Seus dados no seu controle</h3>
            <p>
              Use sem criar conta. Suas listas ficam neste navegador e podem ser
              exportadas em um backup JSON.
            </p>
            <span className="feature-detail">
              <Check size={14} /> Backup para levar seus dados
            </span>
          </article>
        </div>
      </section>
      <section id="como-funciona" className="landing-section landing-steps">
        <div className="landing-section-heading">
          <div className="eyebrow">COMECE EM POUCOS PASSOS</div>
          <h2>
            Sua próxima carta
            <br />
            <em>começa aqui.</em>
          </h2>
        </div>
        <div className="step-grid">
          <article>
            <span>01</span>
            <div>
              <h3>Escolha seu objetivo</h3>
              <p>Crie uma lista de coleção ou uma vitrine de troca e venda.</p>
            </div>
          </article>
          <article>
            <span>02</span>
            <div>
              <h3>Adicione as cartas</h3>
              <p>
                Busque por nome, número ou explore os sets físicos disponíveis.
              </p>
            </div>
          </article>
          <article>
            <span>03</span>
            <div>
              <h3>Acompanhe e compartilhe</h3>
              <p>
                Atualize quantidades, veja seu progresso e exporte sua lista
                quando quiser.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section className="landing-cta">
        <div>
          <div className="eyebrow">
            <Heart size={14} /> CADA CARTA CONTA
          </div>
          <h2>
            Seu próximo objetivo
            <br />
            de coleção está esperando.
          </h2>
          <p>Crie sua primeira lista e comece a acompanhar suas cartas hoje.</p>
        </div>
        <Link to="/lists?new=1" className="button primary">
          Começar minha lista <ChevronRight size={17} />
        </Link>
      </section>
      <footer className="landing-footer">
        <Link to="/" className="landing-brand">
          <span className="brand-mark">◉</span>
          <span>
            pokélist<small>TCG COLLECTION</small>
          </span>
        </Link>
        <span>Feito para colecionar com mais organização.</span>
        <Link to="/settings/appearance">
          Temas Pokémon <ChevronRight size={14} />
        </Link>
        <Link to="/feedback">
          Enviar sugestão <ChevronRight size={14} />
        </Link>
        <Link to="/dashboard">
          Abrir o app <ChevronRight size={14} />
        </Link>
      </footer>
    </main>
  );
}

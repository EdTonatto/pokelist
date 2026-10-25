import { useState, type FormEvent } from "react";
import { ChevronRight, MessageCircle, ShieldCheck } from "lucide-react";
export function FeedbackPage() {
  const [kind, setKind] = useState<"suggestion" | "bug">("suggestion"),
    [title, setTitle] = useState(""),
    [details, setDetails] = useState(""),
    [issueUrl, setIssueUrl] = useState(""),
    [message, setMessage] = useState("");
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const typeLabel = kind === "suggestion" ? "Sugestão" : "Problema";
    const issueTitle = `[${typeLabel}] ${title.trim()}`;
    const body = `## ${typeLabel}\n\n${details.trim()}\n\n---\nEnviado pela área de sugestões do Pokélist.`;
    const url = new URL("https://github.com/EdTonatto/tcg-wishlist/issues/new");
    url.searchParams.set("title", issueTitle);
    url.searchParams.set("body", body);
    const target = url.toString();
    setIssueUrl(target);
    window.open(target, "_blank", "noopener,noreferrer");
    setMessage(
      "Rascunho preparado. No GitHub, revise e clique em “Create issue” para publicar.",
    );
  }
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">AJUDE A MELHORAR O POKÉLIST</div>
          <h1>Enviar uma sugestão</h1>
          <p>
            Conte uma ideia ou relate um problema. O GitHub abrirá uma issue
            preenchida para você revisar e publicar.
          </p>
        </div>
      </div>
      <form className="feedback-panel" onSubmit={submit}>
        <fieldset className="feedback-kind">
          <legend>O que você quer enviar?</legend>
          <label className={kind === "suggestion" ? "selected" : ""}>
            <input
              type="radio"
              name="feedback-kind"
              value="suggestion"
              checked={kind === "suggestion"}
              onChange={() => setKind("suggestion")}
            />
            <span>✦</span>
            <b>Sugestão</b>
            <small>Uma ideia para melhorar o app</small>
          </label>
          <label className={kind === "bug" ? "selected" : ""}>
            <input
              type="radio"
              name="feedback-kind"
              value="bug"
              checked={kind === "bug"}
              onChange={() => setKind("bug")}
            />
            <span>!</span>
            <b>Relatar problema</b>
            <small>Algo não está funcionando como esperado</small>
          </label>
        </fieldset>
        <label className="feedback-field">
          Título
          <input
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "suggestion"
                ? "Ex.: Filtrar cartas por raridade"
                : "Ex.: Busca por número não retorna resultados"
            }
          />
        </label>
        <label className="feedback-field">
          Detalhes
          <textarea
            required
            minLength={10}
            maxLength={5000}
            rows={7}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={
              kind === "suggestion"
                ? "Como essa melhoria ajudaria? O que você gostaria que acontecesse?"
                : "O que aconteceu e o que você esperava que acontecesse?"
            }
          />
          <small>{details.length}/5000 caracteres</small>
        </label>
        <div className="feedback-submit-row">
          <p>
            <ShieldCheck size={15} /> Seu texto será enviado ao GitHub para
            revisão antes de publicar.
          </p>
          <button className="button primary" type="submit">
            <MessageCircle size={16} /> Continuar para o GitHub
          </button>
        </div>
        {message && (
          <div className="feedback-message" role="status">
            {message}
            {issueUrl && (
              <a href={issueUrl} target="_blank" rel="noreferrer">
                Abrir rascunho da issue <ChevronRight size={14} />
              </a>
            )}
          </div>
        )}
      </form>
      <p className="feedback-note">
        O GitHub exige que a pessoa esteja conectada e confirme a criação da
        issue. O Pokélist não pede nem armazena sua senha.
      </p>
    </>
  );
}

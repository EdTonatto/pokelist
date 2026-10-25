import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  FileJson,
  ShieldCheck,
} from "lucide-react";
import { availableQuantity, now, quantity } from "../lib/wishlist";
import { validateList } from "../lib/backup";
import type { Wishlist } from "../types";

export function DataPage({
  lists,
  onImport,
}: {
  lists: Wishlist[];
  onImport: (x: Wishlist[]) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<Wishlist[] | null>(null),
    [message, setMessage] = useState(""),
    total = lists.reduce(
      (n, l) =>
        n +
        l.items.reduce(
          (sum, item) =>
            sum +
            (l.purpose === "trade" ? availableQuantity(item) : quantity(item)),
          0,
        ),
      0,
    );
  function exportData() {
    const blob = new Blob(
        [
          JSON.stringify(
            {
              schemaVersion: 1,
              exportedAt: now(),
              app: "pokemon-tcg-wishlist",
              lists,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `pokemon-wishlist-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem("lastBackup", now());
    setMessage("Backup exportado. Guarde o arquivo em um lugar seguro.");
  }
  async function readFile(f: File) {
    setFile(f);
    setPreview(null);
    setMessage("");
    try {
      if (f.size > 10 * 1024 * 1024)
        throw Error("O arquivo excede o limite de 10 MB.");
      const parsed = JSON.parse(await f.text());
      if (
        parsed.schemaVersion !== 1 ||
        parsed.app !== "pokemon-tcg-wishlist" ||
        !Array.isArray(parsed.lists)
      )
        throw Error("Este arquivo não é um backup válido do Pokélist.");
      const clean: Wishlist[] = parsed.lists.map((l: unknown) =>
        validateList(l),
      );
      if (clean.length > 1000 || clean.some((l) => l.items.length > 10000))
        throw Error("O backup contém dados acima dos limites permitidos.");
      setPreview(clean);
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Não foi possível ler o arquivo.",
      );
    }
  }
  async function importNow() {
    if (!preview) return;
    if (
      !confirm(
        `Importar ${preview.length} listas para sua conta PokeList? Suas listas atuais serão preservadas.`,
      )
    )
      return;
    try {
      await onImport(preview);
      setMessage(`${preview.length} listas importadas e vinculadas à sua conta com sucesso.`);
      setPreview(null);
      setFile(null);
    } catch {
      setMessage(
        "Não foi possível concluir a importação. As listas já salvas na sua conta foram preservadas; algumas listas do arquivo podem ter sido importadas.",
      );
    }
  }
  return (
    <>
      <div className="page-title-row">
        <div>
          <div className="eyebrow">PRIVACIDADE E PORTABILIDADE</div>
          <h1>Dados e backup</h1>
          <p>Seus dados são seus. Veja como protegê-los e levá-los com você.</p>
        </div>
      </div>
      <div className="privacy-banner">
        <div>
          <ShieldCheck size={22} />
        </div>
        <section>
          <h2>Sua coleção é só sua</h2>
          <p>
            Suas listas são vinculadas à sua conta e ficam armazenadas no banco de dados.
            Ao entrar em outro dispositivo, suas listas estarão disponíveis.
          </p>
        </section>
      </div>
      <div className="backup-grid">
        <div className="backup-card">
          <span className="backup-icon export">
            <ArrowDownToLine />
          </span>
          <div className="eyebrow">LEVAR SEUS DADOS</div>
          <h2>Exportar backup</h2>
          <p>
            Baixe um arquivo JSON com todas as suas listas e cartas. Guarde-o em
            um lugar seguro.
          </p>
          <button
            disabled={!lists.length}
            className="button primary"
            onClick={exportData}
          >
            <FileJson size={16} /> Exportar minhas listas
          </button>
          <div className="backup-detail">
            {lists.length} listas · {total} cartas incluídas
          </div>
        </div>
        <div className="backup-card">
          <span className="backup-icon import">
            <ArrowUpFromLine />
          </span>
          <div className="eyebrow">TRAZER SEUS DADOS</div>
          <h2>Importar backup</h2>
          <p>
            Carregue um JSON exportado anteriormente. Você verá uma prévia antes
            de adicionar as listas à sua conta.
          </p>
          <label className="button secondary file-button">
            <ArrowUpFromLine size={16} /> Escolher arquivo
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void readFile(f);
              }}
            />
          </label>
          <div className="backup-detail">
            JSON até 10 MB · Adiciona listas à sua conta
          </div>
        </div>
      </div>
      {message && <div className="message-box">{message}</div>}
      {file && preview && (
        <div className="import-preview">
          <div>
            <div className="eyebrow">PRÉVIA DO ARQUIVO</div>
            <h2>{file.name}</h2>
            <p>
              {preview.length} listas ·{" "}
              {preview.reduce(
                (n, l) =>
                  n +
                  l.items.reduce(
                    (sum, item) =>
                      sum +
                      (l.purpose === "trade"
                        ? availableQuantity(item)
                        : quantity(item)),
                    0,
                  ),
                0,
              )}{" "}
              cartas
            </p>
            {preview.slice(0, 4).map((l) => (
              <span className="preview-chip" key={l.id}>
                {l.name} ·{" "}
                {l.items.reduce(
                  (sum, item) =>
                    sum +
                    (l.purpose === "trade"
                      ? availableQuantity(item)
                      : quantity(item)),
                  0,
                )}{" "}
                {l.purpose === "trade" ? "disponíveis" : "cartas"}
              </span>
            ))}
            <p className="replace-warning">
              <ShieldCheck size={15} /> As listas do arquivo serão vinculadas à sua conta. As{" "}
              {lists.length} listas e {total} cartas existentes serão preservadas.
            </p>
          </div>
          <div className="preview-actions">
            <button
              className="button secondary"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
            >
              Cancelar
            </button>
            <button className="button primary" onClick={() => void importNow()}>
              Importar para minha conta
            </button>
          </div>
        </div>
      )}
      <div className="backup-foot">
        <ShieldCheck size={18} />
        <p>
          <b>Uma observação importante</b>
          <br />
          Suas listas ficam armazenadas na sua conta PokeList e são recuperadas
          no próximo login. Faça backups regularmente para manter uma cópia
          independente dos seus dados.
        </p>
      </div>
    </>
  );
}

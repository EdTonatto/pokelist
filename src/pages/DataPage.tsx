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
        `Substituir todas as ${lists.length} listas atuais por ${preview.length} listas do arquivo? Esta ação não pode ser desfeita.`,
      )
    )
      return;
    try {
      await onImport(preview);
      setMessage(`${preview.length} listas importadas com sucesso.`);
      setPreview(null);
      setFile(null);
    } catch {
      setMessage(
        "Não foi possível gravar o backup. Seus dados atuais foram preservados.",
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
            Suas listas ficam salvas localmente neste navegador, usando
            armazenamento IndexedDB. Nada é enviado para um servidor. Para usar
            em outro dispositivo, transfira um arquivo de backup JSON.
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
            de substituir seus dados.
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
            JSON até 10 MB · Substitui os dados atuais
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
              <ShieldCheck size={15} /> A importação vai substituir{" "}
              {lists.length} listas e {total} cartas deste navegador.
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
              Substituir tudo
            </button>
          </div>
        </div>
      )}
      <div className="backup-foot">
        <ShieldCheck size={18} />
        <p>
          <b>Uma observação importante</b>
          <br />
          Limpar os dados do navegador, usar janela anônima ou trocar de
          dispositivo pode apagar ou deixar sua coleção inacessível. Faça
          backups com frequência. A transferência por JSON cria cópias
          independentes, sem sincronização automática.
        </p>
      </div>
    </>
  );
}

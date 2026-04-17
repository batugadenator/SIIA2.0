import { useEffect, useRef, useState } from "react";
import {
  ConfiguracaoVisual,
  criarConfigVisual,
  deletarConfigVisual,
  editarConfigVisual,
  fetchConfigsVisuais,
} from "../../../services/cms";

const EMPTY_FORM = { chave: "", valor_svg: "", descricao: "" };

export default function ConfigVisualPage() {
  const [configs, setConfigs] = useState<ConfiguracaoVisual[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState({ texto: "", tipo: "info" });
  const formRef = useRef<HTMLDivElement>(null);

  const carregar = () => {
    setCarregando(true);
    fetchConfigsVisuais()
      .then(setConfigs)
      .catch(() => setMsg({ texto: "Erro ao carregar configurações.", tipo: "danger" }))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleSelecionar = (cv: ConfiguracaoVisual) => {
    setEditandoId(cv.id);
    setForm({ chave: cv.chave, valor_svg: cv.valor_svg, descricao: cv.descricao });
    setMsg({ texto: "", tipo: "info" });
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNovo = () => {
    setEditandoId(null);
    setForm({ ...EMPTY_FORM });
    setMsg({ texto: "", tipo: "info" });
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.chave.trim() || !form.valor_svg.trim()) {
      setMsg({ texto: "Chave e valor SVG são obrigatórios.", tipo: "warning" });
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        const atualizado = await editarConfigVisual(editandoId, {
          valor_svg: form.valor_svg,
          descricao: form.descricao,
        });
        setConfigs((prev) => prev.map((c) => (c.id === editandoId ? atualizado : c)));
        setMsg({ texto: "Configuração atualizada.", tipo: "success" });
      } else {
        const criado = await criarConfigVisual(form);
        setConfigs((prev) => [...prev, criado]);
        setMsg({ texto: "Configuração criada.", tipo: "success" });
      }
      setEditandoId(null);
      setForm({ ...EMPTY_FORM });
    } catch (err: any) {
      const detalhe = err?.response?.data?.erro ?? "Erro ao salvar.";
      setMsg({ texto: detalhe, tipo: "danger" });
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (cv: ConfiguracaoVisual) => {
    if (!confirm(`Excluir configuração "${cv.chave}"?`)) return;
    try {
      await deletarConfigVisual(cv.id);
      setConfigs((prev) => prev.filter((c) => c.id !== cv.id));
      if (editandoId === cv.id) handleNovo();
    } catch {
      setMsg({ texto: "Erro ao excluir configuração.", tipo: "danger" });
    }
  };

  const svgPreview = (valor: string) => {
    const v = valor.trim();
    if (!v) return null;
    if (v.startsWith("http://") || v.startsWith("https://"))
      return <img src={v} alt="SVG preview" style={{ width: 40, height: 40, objectFit: "contain" }} />;
    if (v.startsWith("<svg"))
      return (
        <span
          style={{ display: "inline-block", width: 40, height: 40 }}
          dangerouslySetInnerHTML={{ __html: v }}
          aria-hidden="true"
        />
      );
    return <code style={{ fontSize: "0.75rem" }}>{v.slice(0, 30)}…</code>;
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0 }}>
          <i className="fas fa-palette mr-2" aria-hidden="true" />
          Ícones SVG (Configuração Visual)
        </h2>
        <button className="br-button primary small" onClick={handleNovo}>
          <i className="fas fa-plus mr-1" aria-hidden="true" />
          Novo ícone
        </button>
      </div>

      {msg.texto && (
        <div className={`br-message ${msg.tipo}`} role="status" style={{ marginBottom: "0.75rem" }}>
          {msg.texto}
          <button
            className="br-button circle small"
            type="button"
            aria-label="Fechar"
            onClick={() => setMsg({ texto: "", tipo: "info" })}
            style={{ float: "right" }}
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Lista de configurações */}
      {carregando ? (
        <div className="br-loading" aria-label="Carregando configurações..." />
      ) : configs.length === 0 ? (
        <p className="text-muted">Nenhuma configuração visual cadastrada.</p>
      ) : (
        <div
          className="br-table"
          role="region"
          aria-label="Configurações visuais"
          style={{ marginBottom: "2rem" }}
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Preview</th>
                <th scope="col">Chave</th>
                <th scope="col">Descrição</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((cv) => (
                <tr key={cv.id}>
                  <td>{svgPreview(cv.valor_svg)}</td>
                  <td>
                    <code>{cv.chave}</code>
                  </td>
                  <td>{cv.descricao}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="br-button secondary small mr-1"
                      onClick={() => handleSelecionar(cv)}
                      aria-label={`Editar ${cv.chave}`}
                    >
                      <i className="fas fa-edit" aria-hidden="true" />
                    </button>
                    <button
                      className="br-button danger small"
                      onClick={() => handleDeletar(cv)}
                      aria-label={`Excluir ${cv.chave}`}
                    >
                      <i className="fas fa-trash" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formulário */}
      <div ref={formRef} className="br-card" style={{ padding: "1.25rem", maxWidth: 640 }}>
        <h4 style={{ marginTop: 0 }}>
          {editandoId ? `Editar: ${form.chave}` : "Novo ícone SVG"}
        </h4>
        <form onSubmit={handleSalvar} noValidate>
          <div className="br-input mb-2">
            <label htmlFor="cv-chave">Chave (slug) *</label>
            <input
              id="cv-chave"
              type="text"
              value={form.chave}
              onChange={(e) => setForm((f) => ({ ...f, chave: e.target.value }))}
              disabled={Boolean(editandoId)}
              required
              placeholder="icone-central-noticias"
            />
            {editandoId && (
              <small style={{ color: "#888" }}>A chave não pode ser alterada após a criação.</small>
            )}
          </div>
          <div className="br-input mb-2">
            <label htmlFor="cv-descricao">Descrição</label>
            <input
              id="cv-descricao"
              type="text"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              maxLength={200}
            />
          </div>
          <div className="br-textarea mb-2">
            <label htmlFor="cv-svg">Valor SVG *</label>
            <textarea
              id="cv-svg"
              value={form.valor_svg}
              onChange={(e) => setForm((f) => ({ ...f, valor_svg: e.target.value }))}
              rows={6}
              placeholder="Cole aqui o código <svg>...</svg> ou a URL do SVG no Nextcloud."
              required
            />
          </div>
          {/* Preview ao vivo */}
          {form.valor_svg && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem",
                background: "#f8f9fa",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <span style={{ fontSize: "0.8rem", color: "#555" }}>Preview:</span>
              {svgPreview(form.valor_svg)}
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="br-button primary small" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
            <button type="button" className="br-button secondary small" onClick={handleNovo}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

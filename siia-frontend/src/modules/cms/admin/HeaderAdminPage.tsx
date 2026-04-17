import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import {
  autorizarCabecalhoAdmin,
  CabecalhoAdminState,
  CabecalhoHistoricoItem,
  CabecalhoLinkExtraAdmin,
  CabecalhoWorkflowPayload,
  criarCabecalhoLinkExtra,
  deletarCabecalhoLinkExtra,
  editarCabecalhoLinkExtra,
  fetchCabecalhoAdmin,
  fetchCabecalhoHistorico,
  salvarCabecalhoAdmin,
  submeterCabecalhoAdmin,
  uploadCmsImage,
} from "../../../services/cms";
import "../cms-admin.css";

const EMPTY_EXTRA: CabecalhoLinkExtraAdmin = {
  titulo: "",
  link_url: "",
  ordem: 0,
  abrir_em_nova_aba: false,
  ativo: true,
};

export default function HeaderAdminPage() {
  const [state, setState] = useState<CabecalhoAdminState | null>(null);
  const [form, setForm] = useState<CabecalhoWorkflowPayload | null>(null);
  const [historico, setHistorico] = useState<CabecalhoHistoricoItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  const [extraForm, setExtraForm] = useState<CabecalhoLinkExtraAdmin>({ ...EMPTY_EXTRA });
  const [extraEditId, setExtraEditId] = useState<number | null>(null);
  const [savingExtra, setSavingExtra] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([fetchCabecalhoAdmin(), fetchCabecalhoHistorico()])
      .then(([cabecalho, hist]) => {
        setState(cabecalho);
        setForm(cabecalho.rascunho);
        setHistorico(hist);
      })
      .catch(() => setMsg("Erro ao carregar configuração de cabeçalho."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const extrasCount = form?.links_extras.length || 0;
  const canAddExtra = extrasCount < 8 || extraEditId !== null;

  const sortedExtras = useMemo(() => {
    return [...(form?.links_extras || [])].sort((a, b) => (a.ordem - b.ordem) || ((a.id || 0) - (b.id || 0)));
  }, [form?.links_extras]);

  const patchFixo = (key: keyof CabecalhoWorkflowPayload["links_fixos"], field: "titulo" | "titulo_en" | "url" | "abrir_em_nova_aba", value: string | boolean) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        links_fixos: {
          ...prev.links_fixos,
          [key]: {
            ...prev.links_fixos[key],
            [field]: value,
          },
        },
      };
    });
  };

  const saveDraft = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setWarnings([]);
    setMsg("");

    try {
      const res = await salvarCabecalhoAdmin(form);
      setWarnings(res.warnings || []);
      setMsg("Rascunho do cabeçalho salvo.");
      await load();
    } catch (error) {
      const apiError = error as AxiosError<{ erro?: string; detail?: string }>;
      setMsg(apiError.response?.data?.erro || apiError.response?.data?.detail || "Erro ao salvar rascunho.");
    } finally {
      setSaving(false);
    }
  };

  const submitDraft = async () => {
    try {
      await submeterCabecalhoAdmin();
      setMsg("Rascunho submetido para homologação.");
      await load();
    } catch (error) {
      const apiError = error as AxiosError<{ erro?: string; detail?: string }>;
      setMsg(apiError.response?.data?.erro || apiError.response?.data?.detail || "Erro ao submeter rascunho.");
    }
  };

  const authorizeDraft = async () => {
    try {
      await autorizarCabecalhoAdmin();
      setMsg("Cabeçalho homologado e publicado com sucesso.");
      await load();
    } catch (error) {
      const apiError = error as AxiosError<{ erro?: string; detail?: string }>;
      setMsg(apiError.response?.data?.erro || apiError.response?.data?.detail || "Erro ao homologar rascunho.");
    }
  };

  const uploadLogo = async (file?: File | null) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const data = await uploadCmsImage(file);
      setForm((prev) => (prev ? { ...prev, logo_url: data.url } : prev));
      setMsg("Logotipo enviado com sucesso.");
    } catch {
      setMsg("Falha no upload do logotipo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const editExtra = (item: CabecalhoLinkExtraAdmin) => {
    setExtraEditId(item.id || null);
    setExtraForm({ ...item });
  };

  const clearExtra = () => {
    setExtraEditId(null);
    setExtraForm({ ...EMPTY_EXTRA });
  };

  const saveExtra = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!extraForm.titulo.trim() || !extraForm.link_url.trim()) {
      setMsg("Título e URL do link extra são obrigatórios.");
      return;
    }
    setSavingExtra(true);
    try {
      if (extraEditId) {
        await editarCabecalhoLinkExtra(extraEditId, extraForm);
      } else {
        await criarCabecalhoLinkExtra(extraForm);
      }
      clearExtra();
      await load();
      setMsg("Link extra salvo no rascunho.");
    } catch (error) {
      const apiError = error as AxiosError<{ erro?: string; detail?: string }>;
      setMsg(apiError.response?.data?.erro || apiError.response?.data?.detail || "Erro ao salvar link extra.");
    } finally {
      setSavingExtra(false);
    }
  };

  const removeExtra = async (item: CabecalhoLinkExtraAdmin) => {
    if (!item.id) return;
    if (!confirm(`Excluir link extra '${item.titulo}'?`)) return;
    try {
      await deletarCabecalhoLinkExtra(item.id);
      await load();
    } catch {
      setMsg("Erro ao excluir link extra.");
    }
  };

  if (loading || !state || !form) {
    return <div className="br-loading" aria-label="Carregando cabeçalho..." />;
  }

  return (
    <div className="cms-grid-two">
      <div className="br-card cms-panel">
        <h2 className="cms-title-no-margin">
          <i className="fas fa-heading mr-2" aria-hidden="true" />
          Cabeçalho
        </h2>

        {msg && <div className="br-message info cms-msg-gap">{msg}</div>}
        {warnings.length > 0 && (
          <div className="br-message warning cms-msg-gap">
            {warnings.map((warn) => (
              <div key={warn}>{warn}</div>
            ))}
          </div>
        )}

        <div className="cms-msg-gap">
          <strong>Status workflow:</strong> {state.status}
        </div>

        <form onSubmit={saveDraft}>
          <div className="row">
            <div className="col-12 col-md-6">
              <div className="br-input mb-2">
                <label htmlFor="cab-instituicao">Nome instituição (pt-BR)</label>
                <input id="cab-instituicao" value={form.nome_instituicao} onChange={(e) => setForm((prev) => prev ? ({ ...prev, nome_instituicao: e.target.value }) : prev)} />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="br-input mb-2">
                <label htmlFor="cab-instituicao-en">Institution name (en)</label>
                <input id="cab-instituicao-en" value={form.nome_instituicao_en || ""} onChange={(e) => setForm((prev) => prev ? ({ ...prev, nome_instituicao_en: e.target.value }) : prev)} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12 col-md-6">
              <div className="br-input mb-2">
                <label htmlFor="cab-orgao">Nome órgão (pt-BR)</label>
                <input id="cab-orgao" value={form.nome_orgao} onChange={(e) => setForm((prev) => prev ? ({ ...prev, nome_orgao: e.target.value }) : prev)} />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="br-input mb-2">
                <label htmlFor="cab-orgao-en">Organization name (en)</label>
                <input id="cab-orgao-en" value={form.nome_orgao_en || ""} onChange={(e) => setForm((prev) => prev ? ({ ...prev, nome_orgao_en: e.target.value }) : prev)} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12 col-md-6">
              <div className="br-input mb-2">
                <label htmlFor="cab-slogan">Slogan (pt-BR)</label>
                <input id="cab-slogan" value={form.slogan} onChange={(e) => setForm((prev) => prev ? ({ ...prev, slogan: e.target.value }) : prev)} />
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div className="br-input mb-2">
                <label htmlFor="cab-slogan-en">Slogan (en)</label>
                <input id="cab-slogan-en" value={form.slogan_en || ""} onChange={(e) => setForm((prev) => prev ? ({ ...prev, slogan_en: e.target.value }) : prev)} />
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12 col-md-4">
              <div className="br-input mb-2">
                <label htmlFor="cab-logo-url">URL do logotipo</label>
                <input id="cab-logo-url" value={form.logo_url} onChange={(e) => setForm((prev) => prev ? ({ ...prev, logo_url: e.target.value }) : prev)} placeholder="https://.../logo.png" />
              </div>
              <div className="br-input mb-2">
                <label htmlFor="cab-logo-upload">Upload do logotipo</label>
                <input id="cab-logo-upload" type="file" accept=".png,.jpg,.jpeg,.webp,.svg" onChange={(e) => uploadLogo(e.target.files?.[0])} />
                {uploadingLogo && <small>Enviando...</small>}
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="br-input mb-2">
                <label htmlFor="cab-logo-link">Link do logotipo</label>
                <input id="cab-logo-link" value={form.link_logo_url} onChange={(e) => setForm((prev) => prev ? ({ ...prev, link_logo_url: e.target.value }) : prev)} />
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="br-select mb-2">
                <label htmlFor="cab-lang">Idioma padrão</label>
                <select id="cab-lang" value={form.idioma_padrao} onChange={(e) => setForm((prev) => prev ? ({ ...prev, idioma_padrao: e.target.value as "pt-br" | "en" }) : prev)}>
                  <option value="pt-br">Português (Brasil)</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>

          <h4 className="cms-header-gap">Links fixos do topo (pt-BR/en)</h4>
          {([
            ["inicio", "Início"],
            ["servicos", "Serviços"],
            ["contato", "Contato"],
            ["estrutura", "Estrutura Organizacional"],
          ] as const).map(([key, label]) => (
            <div key={key} className="cms-block">
              <strong className="cms-block-title">{label}</strong>
              <div className="row">
                <div className="col-12 col-md-3">
                  <div className="br-input mb-2">
                    <label htmlFor={`${key}-titulo`}>Título (pt-BR)</label>
                    <input id={`${key}-titulo`} value={form.links_fixos[key].titulo} onChange={(e) => patchFixo(key, "titulo", e.target.value)} />
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="br-input mb-2">
                    <label htmlFor={`${key}-titulo-en`}>Title (en)</label>
                    <input id={`${key}-titulo-en`} value={form.links_fixos[key].titulo_en || ""} onChange={(e) => patchFixo(key, "titulo_en", e.target.value)} />
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="br-input mb-2">
                    <label htmlFor={`${key}-url`}>URL</label>
                    <input id={`${key}-url`} value={form.links_fixos[key].url} onChange={(e) => patchFixo(key, "url", e.target.value)} />
                  </div>
                </div>
                <div className="col-12 col-md-2">
                  <div className="br-checkbox cms-checkbox-offset">
                    <input id={`${key}-nova-aba`} type="checkbox" checked={form.links_fixos[key].abrir_em_nova_aba} onChange={(e) => patchFixo(key, "abrir_em_nova_aba", e.target.checked)} />
                    <label htmlFor={`${key}-nova-aba`}>Nova aba</label>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="cms-row-actions">
            <button className="br-button primary" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar Rascunho"}</button>
            <button className="br-button secondary" type="button" onClick={submitDraft}>Submeter</button>
            <button className="br-button success" type="button" onClick={authorizeDraft}>Homologar/Publicar</button>
          </div>
        </form>

        <div className="cms-preview-shell">
          <div className="p-3">
            <strong>Preview em tempo real</strong>
            <div><small>{form.nome_instituicao}</small></div>
            <div><strong>{form.nome_orgao}</strong></div>
            <div><small>{form.slogan}</small></div>
            <div className="mt-2">
              {(form.links_extras || []).filter((i) => i.ativo).map((item, idx) => (
                <span key={`${item.titulo}-${idx}`} className="mr-2">{item.titulo}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="cms-sticky">
        <div className="br-card cms-panel">
          <h4 className="cms-title-no-margin">Links extras ({extrasCount}/8)</h4>
          <form onSubmit={saveExtra}>
            <div className="br-input mb-2">
              <label htmlFor="extra-titulo">Título</label>
              <input id="extra-titulo" value={extraForm.titulo} onChange={(e) => setExtraForm((prev) => ({ ...prev, titulo: e.target.value }))} disabled={!canAddExtra} />
            </div>
            <div className="br-input mb-2">
              <label htmlFor="extra-url">URL</label>
              <input id="extra-url" value={extraForm.link_url} onChange={(e) => setExtraForm((prev) => ({ ...prev, link_url: e.target.value }))} disabled={!canAddExtra} />
            </div>
            <div className="br-input mb-2">
              <label htmlFor="extra-ordem">Ordem</label>
              <input id="extra-ordem" type="number" min={0} value={extraForm.ordem} onChange={(e) => setExtraForm((prev) => ({ ...prev, ordem: Number(e.target.value) }))} disabled={!canAddExtra} />
            </div>
            <div className="br-checkbox mb-2">
              <input id="extra-nova-aba" type="checkbox" checked={extraForm.abrir_em_nova_aba} onChange={(e) => setExtraForm((prev) => ({ ...prev, abrir_em_nova_aba: e.target.checked }))} disabled={!canAddExtra} />
              <label htmlFor="extra-nova-aba">Abrir em nova aba</label>
            </div>
            <div className="cms-row-actions">
              <button className="br-button primary small" type="submit" disabled={savingExtra || !canAddExtra}>{savingExtra ? "Salvando..." : extraEditId ? "Atualizar" : "Adicionar"}</button>
              <button className="br-button secondary small" type="button" onClick={clearExtra}>Limpar</button>
            </div>
          </form>
        </div>

        <div className="br-card cms-panel mt-2">
          {sortedExtras.length === 0 ? (
            <span className="text-muted">Sem links extras.</span>
          ) : (
            sortedExtras.map((item, index) => (
              <div key={`${item.id || index}-${item.titulo}`} className="cms-item-row">
                <span className="label">{item.titulo}</span>
                <button className="br-button secondary small" onClick={() => editExtra(item)} aria-label={`Editar link extra ${item.titulo}`} title={`Editar link extra ${item.titulo}`}>
                  <i className="fas fa-edit" aria-hidden="true" />
                </button>
                <button className="br-button danger small" onClick={() => removeExtra(item)} aria-label={`Excluir link extra ${item.titulo}`} title={`Excluir link extra ${item.titulo}`}>
                  <i className="fas fa-trash" aria-hidden="true" />
                </button>
              </div>
            ))
          )}

          <div className="cms-history">
            {historico.map((h) => (
              <div key={h.id} className="cms-history-item">
                <strong>{h.acao}</strong> - <small>{h.actor_nome || "sistema"}</small>
                <pre>{h.diff_text}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

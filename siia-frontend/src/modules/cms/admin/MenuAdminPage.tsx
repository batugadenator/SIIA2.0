import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import {
  criarMenu,
  deletarMenu,
  editarMenu,
  fetchFontAwesomeIcons,
  fetchMenusAdmin,
  FontAwesomeIconOption,
  MenuPortalAdmin,
} from "../../../services/cms";
import "../cms-admin.css";

const EMPTY_FORM = {
  titulo: "",
  link_url: "",
  icone_classe: "",
  parent: null as number | null,
  ordem: 0,
  abrir_em_nova_aba: false,
  ativo: true,
};

export default function MenuAdminPage() {
  const [menus, setMenus] = useState<MenuPortalAdmin[]>([]);
  const [iconOptions, setIconOptions] = useState<FontAwesomeIconOption[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  const carregar = () => {
    setCarregando(true);
    fetchMenusAdmin()
      .then(setMenus)
      .catch(() => setMsg("Erro ao carregar menus."))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    fetchFontAwesomeIcons({ limit: 500 })
      .then(setIconOptions)
      .catch(() => {
        // Fallback silencioso para não bloquear o formulário em caso de indisponibilidade.
        setIconOptions([]);
      });
  }, []);

  const handleSelecionar = (m: MenuPortalAdmin) => {
    setEditandoId(m.id);
    setForm({
      titulo: m.titulo,
      link_url: m.link_url,
      icone_classe: m.icone_classe,
      parent: m.parent,
      ordem: m.ordem,
      abrir_em_nova_aba: m.abrir_em_nova_aba,
      ativo: m.ativo,
    });
    setMsg("");
  };

  const handleNovo = () => {
    setEditandoId(null);
    setForm({ ...EMPTY_FORM });
    setMsg("");
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.link_url.trim()) {
      setMsg("Título e URL são obrigatórios.");
      return;
    }
    setSalvando(true);
    setMsg("");
    try {
      if (editandoId) {
        await editarMenu(editandoId, form);
        setMsg("Menu atualizado.");
      } else {
        await criarMenu(form);
        setMsg("Menu criado.");
      }
      setEditandoId(null);
      setForm({ ...EMPTY_FORM });
      await carregar();
    } catch (error) {
      const apiError = error as AxiosError<{ erro?: string; detail?: string }>;
      const backendMessage = apiError.response?.data?.erro || apiError.response?.data?.detail;
      setMsg(backendMessage || "Erro ao salvar menu.");
    } finally {
      setSalvando(false);
    }
  };

  const handleDeletar = async (id: number, titulo: string) => {
    if (!confirm(`Excluir menu "${titulo}"?`)) return;
    try {
      await deletarMenu(id);
      setMenus((prev) => prev.filter((m) => m.id !== id));
      if (editandoId === id) handleNovo();
    } catch {
      setMsg("Erro ao excluir menu.");
    }
  };

  const childrenByParent = menus.reduce<Record<string, MenuPortalAdmin[]>>((acc, item) => {
    const key = String(item.parent ?? "root");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  Object.keys(childrenByParent).forEach((key) => {
    childrenByParent[key].sort((a, b) => (a.ordem - b.ordem) || (a.id - b.id));
  });

  const menuDepth = (menu: MenuPortalAdmin) => {
    let depth = 1;
    let parentId = menu.parent;
    const guard = new Set<number>();
    while (parentId) {
      if (guard.has(parentId)) {
        break;
      }
      guard.add(parentId);
      const parent = menus.find((m) => m.id === parentId);
      if (!parent) {
        break;
      }
      depth += 1;
      parentId = parent.parent;
    }
    return depth;
  };

  const renderTree = (parentId: number | null, depth = 1) => {
    const key = String(parentId ?? "root");
    const nodes = childrenByParent[key] || [];
    return nodes.map((item) => (
      <div key={item.id} className={`cms-menu-indent cms-menu-depth-${Math.min(depth, 4)}`}>
        <MenuRow m={item} depth={depth} onEditar={handleSelecionar} onDeletar={handleDeletar} />
        {renderTree(item.id, depth + 1)}
      </div>
    ));
  };

  return (
    <div className="cms-grid-two-menu">
      {/* Lista */}
      <div>
        <div className="cms-menu-toolbar">
          <h2 className="cms-title-no-margin">
            <i className="fas fa-bars mr-2" aria-hidden="true" />
            Menus do Portal
          </h2>
          <button className="br-button primary small" onClick={handleNovo}>
            <i className="fas fa-plus mr-1" aria-hidden="true" />
            Novo menu
          </button>
        </div>

        {msg && (
          <div className="br-message info cms-menu-msg" role="status">
            {msg}
          </div>
        )}

        {carregando ? (
          <div className="br-loading" aria-label="Carregando menus..." />
        ) : menus.length === 0 ? (
          <p className="text-muted">Nenhum menu cadastrado.</p>
        ) : (
          <div>{renderTree(null, 1)}</div>
        )}
      </div>

      {/* Formulário */}
      <div className="cms-menu-editor">
        <div className="br-card cms-menu-card">
          <h4 className="cms-title-no-margin">
            {editandoId ? "Editar menu" : "Novo menu"}
          </h4>
          <form onSubmit={handleSalvar} noValidate>
            <div className="br-input mb-2">
              <label htmlFor="m-titulo">Título *</label>
              <input
                id="m-titulo"
                type="text"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                required
              />
            </div>
            <div className="br-input mb-2">
              <label htmlFor="m-url">URL de destino *</label>
              <input
                id="m-url"
                type="text"
                value={form.link_url}
                onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
                required
                placeholder="https:// ou /caminho"
              />
            </div>
            <div className="br-input mb-2">
              <label htmlFor="m-icone">Ícone (classe FA)</label>
              <select
                id="m-icone"
                value={form.icone_classe}
                onChange={(e) => setForm((f) => ({ ...f, icone_classe: e.target.value }))}
              >
                <option value="">Selecione um ícone</option>
                <optgroup label="Solid (fas)">
                  {iconOptions
                    .filter((i) => i.style === "fas")
                    .map((icon) => (
                      <option key={icon.id} value={icon.class_name}>
                        {icon.label} ({icon.class_name})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Brands (fab)">
                  {iconOptions
                    .filter((i) => i.style === "fab")
                    .map((icon) => (
                      <option key={icon.id} value={icon.class_name}>
                        {icon.label} ({icon.class_name})
                      </option>
                    ))}
                </optgroup>
              </select>
              <small className="text-muted">Catálogo Font Awesome 5.10.2 (foco em Solid/Brands).</small>
            </div>
            <div className="br-input mb-2">
              <label htmlFor="m-parent">Menu pai</label>
              <select
                id="m-parent"
                value={form.parent ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, parent: e.target.value ? Number(e.target.value) : null }))
                }
              >
                <option value="">— raiz —</option>
                {menus
                  .filter((m) => m.id !== editandoId && menuDepth(m) < 4)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {`${"-".repeat(Math.max(0, menuDepth(m) - 1))} ${m.titulo}`}
                    </option>
                  ))}
              </select>
            </div>
            <div className="br-input mb-2">
              <label htmlFor="m-ordem">Ordem</label>
              <input
                id="m-ordem"
                type="number"
                min={0}
                value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: Number(e.target.value) }))}
              />
            </div>
            <div className="br-checkbox mb-2">
              <input
                id="m-nova-aba"
                type="checkbox"
                checked={form.abrir_em_nova_aba}
                onChange={(e) => setForm((f) => ({ ...f, abrir_em_nova_aba: e.target.checked }))}
              />
              <label htmlFor="m-nova-aba">Abrir em nova aba</label>
            </div>
            <div className="br-checkbox mb-3">
              <input
                id="m-ativo"
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
              />
              <label htmlFor="m-ativo">Ativo</label>
            </div>
            <div className="cms-menu-actions">
              <button type="submit" className="br-button primary small" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
              <button type="button" className="br-button secondary small" onClick={handleNovo}>
                Limpar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function MenuRow({
  m,
  depth,
  onEditar,
  onDeletar,
}: {
  m: MenuPortalAdmin;
  depth: number;
  onEditar: (m: MenuPortalAdmin) => void;
  onDeletar: (id: number, titulo: string) => void;
}) {
  return (
    <div className={`cms-menu-row ${m.ativo ? "active" : "inactive"}`}>
      {m.icone_classe && <i className={`${m.icone_classe} icon`} aria-hidden="true" />}
      <span className="label">{`N${depth} - ${m.titulo}`}</span>
      {m.abrir_em_nova_aba && (
        <i className="fas fa-external-link-alt ext" aria-label="Abre em nova aba" />
      )}
      <button
        className="br-button secondary small"
        onClick={() => onEditar(m)}
        aria-label={`Editar menu ${m.titulo}`}
      >
        <i className="fas fa-edit" aria-hidden="true" />
      </button>
      <button
        className="br-button danger small"
        onClick={() => onDeletar(m.id, m.titulo)}
        aria-label={`Excluir menu ${m.titulo}`}
      >
        <i className="fas fa-trash" aria-hidden="true" />
      </button>
    </div>
  );
}

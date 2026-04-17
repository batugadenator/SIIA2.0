import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  deletarNoticia,
  fetchNoticiasWorkflow,
  MePerfilCMS,
  NoticiaWorkflow,
  submeterNoticia,
} from "../../../services/cms";
import "../cms-admin.css";

import type { CmsOutletContext } from "../CmsLayout";
const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  pendente: "Pendente",
  publicado: "Publicado",
};

export default function NoticiaListPage() {
  const { perfil } = useOutletContext<CmsOutletContext>();
  const [noticias, setNoticias] = useState<NoticiaWorkflow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [msg, setMsg] = useState("");

  const carregar = () => {
    setCarregando(true);
    fetchNoticiasWorkflow(filtroStatus as any || undefined)
      .then(setNoticias)
      .catch(() => setMsg("Erro ao carregar notícias."))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  const handleDeletar = async (id: number) => {
    if (!confirm("Confirma exclusão desta notícia?")) return;
    try {
      await deletarNoticia(id);
      setNoticias((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setMsg("Erro ao excluir notícia.");
    }
  };

  const handleSubmeter = async (id: number) => {
    try {
      const atualizada = await submeterNoticia(id);
      setNoticias((prev) => prev.map((n) => (n.id === id ? atualizada : n)));
    } catch {
      setMsg("Erro ao submeter para homologação.");
    }
  };

  return (
    <div>
      <div className="cms-header-row">
        <h2 className="cms-title-no-margin">
          <i className="fas fa-file-alt mr-2" aria-hidden="true" />
          Notícias
        </h2>
        <Link to="nova" className="br-button primary small">
          <i className="fas fa-plus mr-1" aria-hidden="true" />
          Nova Notícia
        </Link>
      </div>

      {msg && (
        <div className="br-message warning" role="alert">
          {msg}
        </div>
      )}

      <div className="cms-filter">
        <label htmlFor="filtro-status" className="sr-only">
          Filtrar por status
        </label>
        <select
          id="filtro-status"
          className="br-select cms-filter-select"
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="pendente">Pendente</option>
          <option value="publicado">Publicado</option>
        </select>
      </div>

      {carregando ? (
        <div className="br-loading" aria-label="Carregando..." />
      ) : noticias.length === 0 ? (
        <p className="text-muted">Nenhuma notícia encontrada.</p>
      ) : (
        <div className="br-table" role="region" aria-label="Lista de notícias">
          <table>
            <thead>
              <tr>
                <th scope="col">Título</th>
                <th scope="col">Status</th>
                <th scope="col">Categoria</th>
                <th scope="col">Autor</th>
                <th scope="col">Publicado em</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {noticias.map((n) => (
                <tr key={n.id}>
                  <td>{n.titulo}</td>
                  <td>
                    <span className={`cms-status-badge ${statusClass(n.status)}`}>
                      {STATUS_LABEL[n.status] ?? n.status}
                    </span>
                  </td>
                  <td>{n.categoria_texto}</td>
                  <td>{n.autor_nome ?? "–"}</td>
                  <td>{new Date(n.data_publicacao).toLocaleDateString("pt-BR")}</td>
                  <td className="cms-nowrap">
                    <Link
                      to={`${n.id}/editar`}
                      className="br-button secondary small mr-1"
                      aria-label={`Editar ${n.titulo}`}
                    >
                      <i className="fas fa-edit" aria-hidden="true" />
                    </Link>
                    {n.status === "rascunho" && (
                      <button
                        className="br-button success small mr-1"
                        onClick={() => handleSubmeter(n.id)}
                        title="Submeter para homologação"
                        aria-label={`Submeter ${n.titulo} para homologação`}
                      >
                        <i className="fas fa-paper-plane" aria-hidden="true" />
                      </button>
                    )}
                    {(perfil.is_admin_cms || n.status === "rascunho") && (
                      <button
                        className="br-button danger small"
                        onClick={() => handleDeletar(n.id)}
                        title="Excluir"
                        aria-label={`Excluir ${n.titulo}`}
                      >
                        <i className="fas fa-trash" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function statusClass(status: string) {
  if (status === "pendente") return "cms-status-pendente";
  if (status === "publicado") return "cms-status-publicado";
  return "cms-status-rascunho";
}

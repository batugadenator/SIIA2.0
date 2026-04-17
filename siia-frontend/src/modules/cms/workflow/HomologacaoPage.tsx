import { useEffect, useState } from "react";
import { autorizarNoticia, fetchNoticiasWorkflow, NoticiaWorkflow } from "../../../services/cms";
import "../cms-admin.css";

export default function HomologacaoPage() {
  const [pendentes, setPendentes] = useState<NoticiaWorkflow[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [msg, setMsg] = useState("");

  const carregar = () => {
    setCarregando(true);
    fetchNoticiasWorkflow("pendente")
      .then(setPendentes)
      .catch(() => setMsg("Erro ao carregar fila de homologação."))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const handleAutorizar = async (id: number) => {
    try {
      const atualizada = await autorizarNoticia(id);
      setPendentes((prev) => prev.filter((n) => n.id !== atualizada.id));
      setMsg(`Notícia "${atualizada.titulo}" publicada com sucesso.`);
    } catch {
      setMsg("Erro ao autorizar publicação.");
    }
  };

  return (
    <div>
      <h2>
        <i className="fas fa-check-circle mr-2" aria-hidden="true" />
        Fila de Homologação
      </h2>

      {msg && (
        <div className="br-message success" role="status">
          {msg}
          <button
            className="br-button circle small cms-float-right"
            type="button"
            aria-label="Fechar mensagem"
            onClick={() => setMsg("")}
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>
      )}

      {carregando ? (
        <div className="br-loading" aria-label="Carregando fila..." />
      ) : pendentes.length === 0 ? (
        <div className="br-message info" role="status">
          <i className="fas fa-info-circle mr-2" aria-hidden="true" />
          Nenhuma notícia aguardando homologação.
        </div>
      ) : (
        <div className="cms-stack">
          {pendentes.map((n) => (
            <div key={n.id} className="br-card cms-pending-card">
              <div className="cms-pending-row">
                <div className="cms-pending-content">
                  <h4 className="cms-pending-title">{n.titulo}</h4>
                  <p className="cms-pending-meta">
                    <strong>Categoria:</strong> {n.categoria_texto} &nbsp;|&nbsp;
                    <strong>Autor:</strong> {n.autor_nome ?? "–"} &nbsp;|&nbsp;
                    <strong>Criado em:</strong>{" "}
                    {new Date(n.data_publicacao).toLocaleDateString("pt-BR")}
                  </p>
                  {n.conteudo && (
                    <p className="cms-pending-text">
                      {n.conteudo}
                    </p>
                  )}
                </div>
                <button
                  className="br-button success"
                  onClick={() => handleAutorizar(n.id)}
                  aria-label={`Autorizar publicação de ${n.titulo}`}
                  title={`Autorizar publicação de ${n.titulo}`}
                >
                  <i className="fas fa-check mr-1" aria-hidden="true" />
                  Autorizar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { FormEvent, useEffect, useState } from "react";
import {
  fetchSiaggGovernanceDocuments,
  uploadSiaggGovernanceDocument,
  type SiaggGovernanceDocument,
} from "../../../services/siagg";

export default function SiaggGovernancePage() {
  const pageSize = 5;

  const [documents, setDocuments] = useState<SiaggGovernanceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Estrategico");
  const [arquivo, setArquivo] = useState<File | null>(null);

  async function load(filters?: {
    categoria?: string;
    search?: string;
    dataInicio?: string;
    dataFim?: string;
  }) {
    setLoading(true);
    setListError("");
    try {
      const list = await fetchSiaggGovernanceDocuments(filters);
      setDocuments(list);
    } catch {
      setListError("Nao foi possivel carregar os documentos no endpoint /api/siagg/governance-documents/.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!arquivo || !titulo) {
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      await uploadSiaggGovernanceDocument({
        titulo,
        descricao,
        categoria,
        arquivo,
      });

      setTitulo("");
      setDescricao("");
      setCategoria("Estrategico");
      setArquivo(null);
      await load({
        categoria: filterCategoria || undefined,
        search: filterSearch || undefined,
        dataInicio: filterDataInicio || undefined,
        dataFim: filterDataFim || undefined,
      });
    } catch {
      setSubmitError("Falha ao enviar documento no endpoint /api/siagg/governance-documents/.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    await load({
      categoria: filterCategoria.trim() || undefined,
      search: filterSearch.trim() || undefined,
      dataInicio: filterDataInicio || undefined,
      dataFim: filterDataFim || undefined,
    });
  }

  const totalPages = Math.max(1, Math.ceil(documents.length / pageSize));
  const paginatedDocuments = documents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="siagg-home">
      <header className="siagg-hero">
        <div>
          <p className="siagg-kicker">SIAGG</p>
          <h2 className="siagg-title">Governanca</h2>
          <p className="siagg-description">Repositorio de documentos com upload PDF integrado ao backend.</p>
        </div>
      </header>

      {listError && <div className="siagg-panel">{listError}</div>}
      {submitError && <div className="siagg-panel">{submitError}</div>}

      <div className="siagg-panel">
        <h3>Filtros avancados</h3>
        <form className="siagg-form" onSubmit={handleFilter}>
          <label>
            Categoria
            <input value={filterCategoria} onChange={(event) => setFilterCategoria(event.target.value)} placeholder="Ex.: Estrategico" />
          </label>
          <label>
            Busca por titulo/descricao
            <input value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="Ex.: plano" />
          </label>
          <label>
            Data inicio
            <input type="date" value={filterDataInicio} onChange={(event) => setFilterDataInicio(event.target.value)} />
          </label>
          <label>
            Data fim
            <input type="date" value={filterDataFim} onChange={(event) => setFilterDataFim(event.target.value)} />
          </label>
          <button type="submit" disabled={loading}>{loading ? "Filtrando..." : "Aplicar filtros"}</button>
        </form>
      </div>

      <div className="siagg-panel">
        <h3>Enviar documento</h3>
        <form className="siagg-form" onSubmit={handleSubmit}>
          <label>
            Titulo
            <input value={titulo} onChange={(event) => setTitulo(event.target.value)} required />
          </label>
          <label>
            Categoria
            <input value={categoria} onChange={(event) => setCategoria(event.target.value)} required />
          </label>
          <label>
            Descricao
            <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} rows={3} />
          </label>
          <label>
            PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setArquivo(event.target.files?.[0] ?? null)}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar documento"}</button>
        </form>
      </div>

      <div className="siagg-panel">
        <h3>Documentos cadastrados</h3>
        {loading ? (
          <p>Carregando documentos...</p>
        ) : documents.length === 0 ? (
          <p>Nenhum documento encontrado para os filtros selecionados.</p>
        ) : (
          <>
            <table className="siagg-table">
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Categoria</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.titulo}</td>
                    <td>{doc.categoria}</td>
                    <td>{new Date(doc.criado_em).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="siagg-pagination">
              <button
                type="button"
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
              >
                Anterior
              </button>
              <span>Pagina {currentPage} de {totalPages}</span>
              <button
                type="button"
                onClick={() => setCurrentPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
              >
                Proxima
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

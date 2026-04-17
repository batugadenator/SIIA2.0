import { FormEvent, useEffect, useState } from "react";
import {
  createSiaggReport,
  fetchSiaggAreas,
  fetchSiaggReports,
  uploadSiaggReportFile,
  type SiaggArea,
  type SiaggReport,
} from "../../../services/siagg";

export default function SiaggReportsPage() {
  const pageSize = 5;

  const [areas, setAreas] = useState<SiaggArea[]>([]);
  const [reports, setReports] = useState<SiaggReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [createError, setCreateError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedArea, setSelectedArea] = useState<number>(0);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataReferencia, setDataReferencia] = useState("");

  const [filterAreaId, setFilterAreaId] = useState<number>(0);
  const [filterDataInicio, setFilterDataInicio] = useState("");
  const [filterDataFim, setFilterDataFim] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const [uploadTarget, setUploadTarget] = useState<number>(0);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  async function load(filters?: {
    areaId?: number;
    dataInicio?: string;
    dataFim?: string;
    search?: string;
  }) {
    setLoading(true);
    setListError("");
    try {
      const [areaList, reportList] = await Promise.all([fetchSiaggAreas(), fetchSiaggReports(filters)]);
      setAreas(areaList);
      setReports(reportList);
      if (areaList.length > 0 && selectedArea === 0) {
        setSelectedArea(areaList[0].id);
      }
      if (reportList.length > 0 && uploadTarget === 0) {
        setUploadTarget(reportList[0].id);
      }
    } catch {
      setListError("Nao foi possivel carregar os relatorios no endpoint /api/siagg/reports/.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreateReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedArea || !titulo || !dataReferencia) {
      return;
    }

    setSubmitting(true);
    setCreateError("");
    try {
      await createSiaggReport({
        area: selectedArea,
        titulo,
        descricao,
        data_referencia: dataReferencia,
      });
      setTitulo("");
      setDescricao("");
      setDataReferencia("");
      await load({
        areaId: filterAreaId || undefined,
        dataInicio: filterDataInicio || undefined,
        dataFim: filterDataFim || undefined,
        search: filterSearch || undefined,
      });
    } catch {
      setCreateError("Falha ao criar relatorio no endpoint /api/siagg/reports/.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadTarget || !uploadFile) {
      return;
    }

    setSubmitting(true);
    setUploadError("");
    try {
      await uploadSiaggReportFile(uploadTarget, uploadFile);
      setUploadFile(null);
      await load({
        areaId: filterAreaId || undefined,
        dataInicio: filterDataInicio || undefined,
        dataFim: filterDataFim || undefined,
        search: filterSearch || undefined,
      });
    } catch {
      setUploadError("Falha ao enviar arquivo PDF no endpoint /api/siagg/reports/{id}/arquivos/.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    await load({
      areaId: filterAreaId || undefined,
      dataInicio: filterDataInicio || undefined,
      dataFim: filterDataFim || undefined,
      search: filterSearch.trim() || undefined,
    });
  }

  const totalPages = Math.max(1, Math.ceil(reports.length / pageSize));
  const paginatedReports = reports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="siagg-home">
      <header className="siagg-hero">
        <div>
          <p className="siagg-kicker">SIAGG</p>
          <h2 className="siagg-title">Relatorios</h2>
          <p className="siagg-description">Criacao de relatorios e upload de anexos PDF com os endpoints do PR-04.</p>
        </div>
      </header>

      {listError && <div className="siagg-panel">{listError}</div>}
      {createError && <div className="siagg-panel">{createError}</div>}
      {uploadError && <div className="siagg-panel">{uploadError}</div>}

      <div className="siagg-grid">
        <article className="siagg-card">
          <span className="siagg-card-label">Total</span>
          <strong>{reports.length}</strong>
          <span>Relatorios cadastrados.</span>
        </article>
      </div>

      <div className="siagg-panel">
        <h3>Filtros avancados</h3>
        <form className="siagg-form" onSubmit={handleFilterSubmit}>
          <label>
            Area
            <select value={filterAreaId} onChange={(event) => setFilterAreaId(Number(event.target.value))}>
              <option value={0}>Todas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.nome}</option>
              ))}
            </select>
          </label>
          <label>
            Data inicio
            <input type="date" value={filterDataInicio} onChange={(event) => setFilterDataInicio(event.target.value)} />
          </label>
          <label>
            Data fim
            <input type="date" value={filterDataFim} onChange={(event) => setFilterDataFim(event.target.value)} />
          </label>
          <label>
            Busca por titulo/descricao
            <input value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="Ex.: trimestral" />
          </label>
          <button type="submit" disabled={loading}>{loading ? "Filtrando..." : "Aplicar filtros"}</button>
        </form>
      </div>

      <div className="siagg-panel">
        <h3>Novo relatorio</h3>
        <form className="siagg-form" onSubmit={handleCreateReport}>
          <label>
            Area
            <select value={selectedArea} onChange={(event) => setSelectedArea(Number(event.target.value))}>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.nome}</option>
              ))}
            </select>
          </label>
          <label>
            Titulo
            <input value={titulo} onChange={(event) => setTitulo(event.target.value)} required />
          </label>
          <label>
            Data referencia
            <input type="date" value={dataReferencia} onChange={(event) => setDataReferencia(event.target.value)} required />
          </label>
          <label>
            Descricao
            <textarea value={descricao} onChange={(event) => setDescricao(event.target.value)} rows={3} />
          </label>
          <button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Criar relatorio"}</button>
        </form>
      </div>

      <div className="siagg-panel">
        <h3>Upload de anexo PDF</h3>
        <form className="siagg-form" onSubmit={handleUpload}>
          <label>
            Relatorio
            <select value={uploadTarget} onChange={(event) => setUploadTarget(Number(event.target.value))}>
              <option value={0}>Selecione...</option>
              {reports.map((report) => (
                <option key={report.id} value={report.id}>{report.titulo}</option>
              ))}
            </select>
          </label>
          <label>
            Arquivo PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
              required
            />
          </label>
          <button type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar anexo"}</button>
        </form>
      </div>

      <div className="siagg-panel">
        <h3>Relatorios cadastrados</h3>
        {loading ? (
          <p>Carregando relatorios...</p>
        ) : reports.length === 0 ? (
          <p>Nenhum relatorio encontrado para os filtros selecionados.</p>
        ) : (
          <>
            <table className="siagg-table">
              <thead>
                <tr>
                  <th>Titulo</th>
                  <th>Data</th>
                  <th>Anexos</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.titulo}</td>
                    <td>{report.data_referencia}</td>
                    <td>{report.arquivos.length}</td>
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

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchSiaggAreas, fetchSiaggDataEntries, type SiaggArea, type SiaggDataEntry } from "../../../services/siagg";

export default function SiaggAreaDetailPage() {
  const pageSize = 5;

  const { areaId } = useParams();
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState<SiaggArea[]>([]);
  const [entries, setEntries] = useState<SiaggDataEntry[]>([]);
  const [areaError, setAreaError] = useState("");
  const [entryError, setEntryError] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const areaNumericId = Number(areaId);

  useEffect(() => {
    let mounted = true;

    async function load(filters?: { dataInicio?: string; dataFim?: string }) {
      setLoading(true);
      setAreaError("");
      setEntryError("");
      try {
        const areaList = await fetchSiaggAreas();

        let dataList: SiaggDataEntry[] = [];
        try {
          dataList = await fetchSiaggDataEntries({
            areaId: areaNumericId,
            dataInicio: filters?.dataInicio,
            dataFim: filters?.dataFim,
          });
        } catch {
          if (mounted) {
            setEntryError("Nao foi possivel consultar /api/siagg/data-entries/ para a area selecionada.");
          }
        }

        if (!mounted) {
          return;
        }

        setAreas(areaList);
        setEntries(dataList);
      } catch {
        if (mounted) {
          setAreaError("Nao foi possivel carregar /api/siagg/areas/.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (Number.isFinite(areaNumericId)) {
      void load();
    } else {
      setLoading(false);
      setAreaError("Area invalida.");
    }

    return () => {
      mounted = false;
    };
  }, [areaNumericId]);

  const selectedArea = useMemo(
    () => areas.find((area) => area.id === areaNumericId),
    [areas, areaNumericId],
  );

  const totalValor = useMemo(
    () => entries.reduce((acc, item) => acc + Number(item.valor), 0),
    [entries],
  );

  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const paginatedEntries = entries.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPage(1);
    setLoading(true);
    setEntryError("");

    try {
      const filteredEntries = await fetchSiaggDataEntries({
        areaId: areaNumericId,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });
      setEntries(filteredEntries);
    } catch {
      setEntryError("Nao foi possivel aplicar filtros em /api/siagg/data-entries/.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="siagg-home">
      <header className="siagg-hero">
        <div>
          <p className="siagg-kicker">Area SIAGG</p>
          <h2 className="siagg-title">{selectedArea?.nome ?? "Detalhe da Area"}</h2>
          <p className="siagg-description">{selectedArea?.descricao ?? "Acompanhamento de indicadores da area selecionada."}</p>
        </div>

        <div className="siagg-hero-card">
          <span className="siagg-hero-label">Navegacao</span>
          <strong><Link to="/dashboard/siagg">Voltar ao painel</Link></strong>
          <span>Filtros e analiticos usam os endpoints entregues no backend.</span>
        </div>
      </header>

      {loading && <div className="siagg-panel">Carregando dados da area...</div>}
      {areaError && !loading && <div className="siagg-panel">{areaError}</div>}
      {entryError && !loading && <div className="siagg-panel">{entryError}</div>}

      {!loading && !areaError && (
        <>
          <div className="siagg-grid">
            <article className="siagg-card">
              <span className="siagg-card-label">Total de indicadores</span>
              <strong>{entries.length}</strong>
              <span>Registros encontrados para a area.</span>
            </article>
            <article className="siagg-card">
              <span className="siagg-card-label">Valor agregado</span>
              <strong>{totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
              <span>Soma dos valores cadastrados.</span>
            </article>
            <article className="siagg-card">
              <span className="siagg-card-label">Ultima referencia</span>
              <strong>{entries[0]?.data_referencia ?? "-"}</strong>
              <span>Data mais recente de referencia.</span>
            </article>
          </div>

          <div className="siagg-panel">
            <h3>Filtros avancados</h3>
            <form className="siagg-form" onSubmit={handleFilter}>
              <label>
                Data inicio
                <input type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} />
              </label>
              <label>
                Data fim
                <input type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />
              </label>
              <button type="submit" disabled={loading}>{loading ? "Filtrando..." : "Aplicar filtros"}</button>
            </form>
          </div>

          <div className="siagg-panel">
            <h3>Indicadores da area</h3>
            {entries.length === 0 ? (
              <p>Nenhum indicador encontrado para os filtros selecionados.</p>
            ) : (
              <>
                <table className="siagg-table">
                  <thead>
                    <tr>
                      <th>Titulo</th>
                      <th>Valor</th>
                      <th>Data referencia</th>
                      <th>Observacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.titulo}</td>
                        <td>{Number(entry.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                        <td>{entry.data_referencia}</td>
                        <td>{entry.observacao || "-"}</td>
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
        </>
      )}
    </section>
  );
}

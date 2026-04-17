import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchSiaggAreas,
  fetchSiaggDataEntries,
  fetchSiaggReports,
  type SiaggArea,
  type SiaggDataEntry,
  type SiaggReport,
} from "../../services/siagg";
import './SiaggDashboardPage.css';

export default function SiaggDashboardPage() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [areas, setAreas] = useState<SiaggArea[]>([]);
  const [dataEntries, setDataEntries] = useState<SiaggDataEntry[]>([]);
  const [reports, setReports] = useState<SiaggReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaError, setAreaError] = useState("");
  const [entryError, setEntryError] = useState("");
  const [reportError, setReportError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard(filters?: { dataInicio?: string; dataFim?: string }) {
      setLoading(true);
      setAreaError("");
      setEntryError("");
      setReportError("");

      try {
        const areaList = await fetchSiaggAreas();

        let entryList: SiaggDataEntry[] = [];
        let reportList: SiaggReport[] = [];

        try {
          entryList = await fetchSiaggDataEntries({
            dataInicio: filters?.dataInicio,
            dataFim: filters?.dataFim,
          });
        } catch {
          if (mounted) {
            setEntryError("Falha ao consultar /api/siagg/data-entries/.");
          }
        }

        try {
          reportList = await fetchSiaggReports({
            dataInicio: filters?.dataInicio,
            dataFim: filters?.dataFim,
          });
        } catch {
          if (mounted) {
            setReportError("Falha ao consultar /api/siagg/reports/.");
          }
        }

        if (!mounted) {
          return;
        }

        setAreas(areaList);
        setDataEntries(entryList);
        setReports(reportList);
      } catch {
        if (mounted) {
          setAreaError("Falha ao consultar /api/siagg/areas/.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setEntryError("");
    setReportError("");

    try {
      const [entryList, reportList] = await Promise.all([
        fetchSiaggDataEntries({
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined,
        }),
        fetchSiaggReports({
          dataInicio: dataInicio || undefined,
          dataFim: dataFim || undefined,
        }),
      ]);

      setDataEntries(entryList);
      setReports(reportList);
    } catch {
      setEntryError("Falha ao aplicar filtros em /api/siagg/data-entries/.");
      setReportError("Falha ao aplicar filtros em /api/siagg/reports/.");
    } finally {
      setLoading(false);
    }
  }

  const latestAreas = useMemo(() => areas.slice(0, 6), [areas]);
  const totalValor = useMemo(
    () => dataEntries.reduce((acc, item) => acc + Number(item.valor), 0),
    [dataEntries],
  );

  return (
    <section className="siagg-home">
      <header className="siagg-hero">
        <div>
          <p className="siagg-kicker">Visao executiva</p>
          <h2 className="siagg-title">SIAGG</h2>
          <p className="siagg-description">
            Painel de governanca para acompanhamento institucional, indicadores e entregas do modulo.
          </p>
        </div>

        <div className="siagg-hero-card">
          <span className="siagg-hero-label">Status da operacao</span>
          <strong>Portal em uso</strong>
          <span>Layout consolidado no wrapper comum.</span>
        </div>
      </header>

      <div className="siagg-grid">
        <article className="siagg-card">
          <span className="siagg-card-label">Atendimentos</span>
          <strong>{loading ? "..." : dataEntries.length}</strong>
          <span>Indicadores cadastrados no modulo.</span>
        </article>
        <article className="siagg-card">
          <span className="siagg-card-label">Relatorios</span>
          <strong>{loading ? "..." : reports.length}</strong>
          <span>Relatorios registrados.</span>
        </article>
        <article className="siagg-card">
          <span className="siagg-card-label">Valor agregado</span>
          <strong>{loading ? "..." : totalValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
          <span>Soma dos indicadores filtrados.</span>
        </article>
        <article className="siagg-card">
          <span className="siagg-card-label">Unidades</span>
          <strong>{loading ? "..." : areas.length}</strong>
          <span>Areas SIAGG ativas.</span>
        </article>
      </div>

      {areaError && <div className="siagg-panel">{areaError}</div>}
      {entryError && <div className="siagg-panel">{entryError}</div>}
      {reportError && <div className="siagg-panel">{reportError}</div>}

      <div className="siagg-panel">
        <h3>Ponto de entrada</h3>
        <p>
          Este painel agora esta integrado aos endpoints do backend SIAGG para Areas, Data Entries e Reports.
        </p>
      </div>

      <div className="siagg-panel">
        <h3>Filtro global de periodo</h3>
        <form className="siagg-form siagg-inline-filters" onSubmit={handleFilter}>
          <label>
            Data inicio
            <input type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} />
          </label>
          <label>
            Data fim
            <input type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} />
          </label>
          <button type="submit" disabled={loading}>{loading ? "Consultando..." : "Recalcular"}</button>
        </form>
      </div>

      <div className="siagg-panel">
        <h3>Areas monitoradas</h3>
        {loading ? (
          <p>Carregando areas...</p>
        ) : latestAreas.length === 0 ? (
          <p>Nenhuma area cadastrada para o periodo informado.</p>
        ) : (
          <ul className="siagg-area-list">
            {latestAreas.map((area) => (
              <li key={area.id}>
                <Link to={`/dashboard/siagg/areas/${area.id}`}>{area.nome}</Link>
                <span>{area.descricao || "Sem descricao"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

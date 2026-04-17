import { FormEvent, useState } from "react";
import { fetchPncpSummary, refreshPncpSummary, type PncpSummary } from "../../../services/siagg";

export default function SiaggPncpPage() {
  const [cnpj, setCnpj] = useState("00394452000103");
  const [ano, setAno] = useState<number>(2026);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<PncpSummary | null>(null);

  async function handleLoad(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await fetchPncpSummary(cnpj, ano);
      setSummary(data);
    } catch {
      setError("Nao foi possivel consultar o PNCP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setLoading(true);
    setError("");
    try {
      const data = await refreshPncpSummary(cnpj, ano);
      setSummary(data);
    } catch {
      setError("Nao foi possivel atualizar os dados do PNCP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="siagg-home">
      <header className="siagg-hero">
        <div>
          <p className="siagg-kicker">SIAGG</p>
          <h2 className="siagg-title">PNCP</h2>
          <p className="siagg-description">Consulta resumida do PCA com cache e refresh manual.</p>
        </div>
      </header>

      {error && <div className="siagg-panel">{error}</div>}

      <div className="siagg-panel">
        <h3>Consultar PNCP</h3>
        <form className="siagg-form" onSubmit={handleLoad}>
          <label>
            CNPJ
            <input value={cnpj} onChange={(event) => setCnpj(event.target.value)} required />
          </label>
          <label>
            Ano
            <input type="number" value={ano} onChange={(event) => setAno(Number(event.target.value))} required />
          </label>
          <button type="submit" disabled={loading}>{loading ? "Consultando..." : "Consultar"}</button>
          <button type="button" disabled={loading} onClick={handleRefresh}>{loading ? "Atualizando..." : "Forcar refresh"}</button>
        </form>
      </div>

      {summary && (
        <div className="siagg-panel">
          <h3>Resumo PCA</h3>
          <div className="siagg-grid">
            <article className="siagg-card">
              <span className="siagg-card-label">Total de itens</span>
              <strong>{summary.total_itens}</strong>
              <span>Itens consolidados do PCA.</span>
            </article>
            <article className="siagg-card">
              <span className="siagg-card-label">Valor total</span>
              <strong>{summary.valor_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
              <span>Valor agregado por categoria.</span>
            </article>
            <article className="siagg-card">
              <span className="siagg-card-label">Categorias</span>
              <strong>{summary.quantidade_categorias}</strong>
              <span>Quantidade de agrupamentos.</span>
            </article>
          </div>

          <table className="siagg-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {summary.categorias.map((categoria) => (
                <tr key={categoria.name}>
                  <td>{categoria.name}</td>
                  <td>{categoria.quantity}</td>
                  <td>{categoria.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchLaunchpadApps, type LaunchpadApp } from "../../services/launchpad";

type AppsDashboardPageProps = {
  section?: "launchpad" | "legados";
};

function resolveToolIcon(card: LaunchpadApp): string {
  const codigo = (card.codigo || "").toLowerCase();
  const iconFromApi = (card.icon || "").trim();

  const iconMap: Record<string, string> = {
    cadfuncional: "fas fa-stethoscope",
    siagg: "fas fa-folder-open",
    cms: "fas fa-edit",
    "legados-hub": "fas fa-toolbox",
  };

  if (codigo.startsWith("legado-")) {
    return "fas fa-tools";
  }

  if (!iconFromApi || iconFromApi === "fas fa-cubes" || iconFromApi === "fas fa-layer-group") {
    return iconMap[codigo] || "fas fa-toolbox";
  }

  return iconFromApi;
}

export default function AppsDashboardPage({ section = "launchpad" }: AppsDashboardPageProps) {
  const [cards, setCards] = useState<LaunchpadApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const skeletonKeys = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    let mounted = true;

    async function loadCards() {
      setLoading(true);
      setErrorMessage("");

      try {
        const data = await fetchLaunchpadApps(section);
        if (!mounted) {
          return;
        }
        setCards(data);
      } catch {
        if (!mounted) {
          return;
        }
        setErrorMessage("Nao foi possivel carregar os aplicativos permitidos para este perfil.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCards();

    return () => {
      mounted = false;
    };
  }, [section]);

  const headerTitle = section === "legados" ? "Sistemas Legados (PHP)" : "Launchpad Operacional";
  const headerDescription =
    section === "legados"
      ? "Catalogo dinamico de acesso rapido aos modulos legados autorizados para seu perfil."
      : "Escolha o modulo autorizado para sair do portal institucional e entrar no fluxo de produtividade.";
  const totalCards = cards.length;
  const externalCards = cards.filter((card) => card.tipo_acesso === "externo" || section === "legados").length;
  const internalCards = cards.filter((card) => card.tipo_acesso !== "externo" && section !== "legados").length;
  const statusText = loading
    ? "Sincronizando catalogo autorizado..."
    : `Ultima sincronizacao: ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <section className="apps-dashboard">
      <header className="apps-dashboard-hero" aria-label="Resumo do launchpad">
        <div className="apps-dashboard-header">
          <span className="apps-dashboard-eyebrow">Painel inicial</span>
          <h1>{headerTitle}</h1>
          <p>{headerDescription}</p>
        </div>
        <div className="apps-dashboard-status" role="status" aria-live="polite">
          {loading ? <span className="skeleton-line skeleton-line-status" aria-hidden="true"></span> : statusText}
        </div>
      </header>

      <section className="apps-kpi-grid" aria-label="Indicadores do catalogo">
        {loading ? (
          <>
            <article className="apps-kpi-card" aria-hidden="true">
              <span className="apps-kpi-label skeleton-line skeleton-line-sm"></span>
              <strong className="skeleton-line skeleton-line-lg"></strong>
            </article>
            <article className="apps-kpi-card" aria-hidden="true">
              <span className="apps-kpi-label skeleton-line skeleton-line-sm"></span>
              <strong className="skeleton-line skeleton-line-lg"></strong>
            </article>
            <article className="apps-kpi-card" aria-hidden="true">
              <span className="apps-kpi-label skeleton-line skeleton-line-sm"></span>
              <strong className="skeleton-line skeleton-line-lg"></strong>
            </article>
          </>
        ) : (
          <>
            <article className="apps-kpi-card">
              <span className="apps-kpi-label">Aplicativos liberados</span>
              <strong>{totalCards}</strong>
            </article>
            <article className="apps-kpi-card">
              <span className="apps-kpi-label">Acesso interno</span>
              <strong>{internalCards}</strong>
            </article>
            <article className="apps-kpi-card">
              <span className="apps-kpi-label">Acesso externo</span>
              <strong>{externalCards}</strong>
            </article>
          </>
        )}
      </section>

      {loading && <p className="apps-loading-text">Carregando catalogo autorizado...</p>}
      {!loading && errorMessage && <p>{errorMessage}</p>}
      {!loading && !errorMessage && cards.length === 0 && (
        <p>{section === "legados" ? "Nenhum aplicativo legado liberado para seu perfil." : "Nenhum aplicativo liberado para seu perfil."}</p>
      )}

      <div className="apps-grid">
        {loading
          ? skeletonKeys.map((key) => (
              <article key={key} className="app-card-modern app-card-skeleton" aria-hidden="true">
                <span className="app-card-icon skeleton-circle"></span>
                <span className="app-badge skeleton-line skeleton-line-sm"></span>
                <h2 className="skeleton-line skeleton-line-md"></h2>
                <p className="skeleton-line"></p>
                <p className="skeleton-line skeleton-line-sm"></p>
                <span className="app-card-meta skeleton-line skeleton-line-xs"></span>
                <span className="app-link skeleton-line skeleton-line-sm"></span>
              </article>
            ))
          : cards.map((card) => (
              <article key={card.id} className="app-card-modern">
                <i className={`app-card-icon ${resolveToolIcon(card)}`} aria-hidden="true"></i>
                <span className="app-badge">{card.badge || (section === "legados" ? "Legado" : "Ferramenta")}</span>
                <h2>{card.nome}</h2>
                <p>{card.descricao}</p>
                <span className="app-card-meta">
                  {section === "legados" || card.tipo_acesso === "externo" ? "Acesso externo" : "Acesso interno"}
                </span>
                {section === "legados" || card.tipo_acesso === "externo" ?
                  <a
                    href={card.url_externa}
                    target={card.abrir_em_nova_aba ? "_blank" : "_self"}
                    rel={card.abrir_em_nova_aba ? "noreferrer" : undefined}
                    className="app-link"
                  >
                    {section === "legados" ? "Abrir modulo" : "Acessar aplicativo"}
                  </a>
                :
                  <Link to={card.rota_interna || "/dashboard"} className="app-link">
                    Acessar aplicativo
                  </Link>
                }
              </article>
            ))}
      </div>
    </section>
  );
}

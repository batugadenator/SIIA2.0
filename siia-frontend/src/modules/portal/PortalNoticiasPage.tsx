import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CmsNoticia, CmsNoticiasPageResponse, fetchPublicNoticiasPage } from "../../services/cms";

function formatDate(rawDate: string): string {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

const PAGE_SIZE = 12;

export default function PortalNoticiasPage() {
  const [response, setResponse] = useState<CmsNoticiasPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [categoria, setCategoria] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  const query = (searchParams.get("q") || "").trim();

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchPublicNoticiasPage(page, PAGE_SIZE, categoria, query)
      .then((data) => {
        if (!mounted) {
          return;
        }
        setResponse(data);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [page, categoria, query]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const noticias = response?.results ?? [];
  const categorias = response?.categorias_disponiveis ?? [];

  return (
    <section className="noticias-page">
      <header className="noticias-page-header">
        <div>
          <h1>Mais Noticias</h1>
          <p>Fila completa de noticias do CMS com filtro por categoria e busca textual.</p>
        </div>
        <Link to="/" className="br-button secondary">
          Voltar para a Home
        </Link>
      </header>

      <div className="noticias-toolbar">
        <label htmlFor="filtro-busca">Busca</label>
        <input
          id="filtro-busca"
          type="search"
          value={query}
          placeholder="Título, conteúdo ou categoria"
          onChange={(event) => {
            const next = event.target.value;
            const params = new URLSearchParams(searchParams);
            if (next.trim()) {
              params.set("q", next);
            } else {
              params.delete("q");
            }
            setSearchParams(params, { replace: true });
          }}
        />

        <label htmlFor="filtro-categoria">Categoria</label>
        <select
          id="filtro-categoria"
          value={categoria}
          onChange={(event) => {
            setPage(1);
            setCategoria(event.target.value);
          }}
        >
          <option value="">Todas</option>
          {categorias.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="public-loading">Carregando noticias...</div>}

      {!loading && (
        <>
          <div className="noticias-grid">
            {noticias.map((noticia: CmsNoticia) => (
              <article key={noticia.id} className="noticia-card br-card">
                <div className="noticia-thumb">
                  {noticia.imagem_url ? (
                    <img className="noticia-thumb-image" src={noticia.imagem_url} alt="" loading="lazy" />
                  ) : (
                    <div className="noticia-thumb-fallback" aria-hidden="true"></div>
                  )}
                </div>
                <div className="noticia-body">
                  <span className="br-tag info">{noticia.categoria_texto}</span>
                  <h2>{noticia.titulo}</h2>
                  <small>{formatDate(noticia.data_publicacao)}</small>
                  <p>{noticia.conteudo}</p>
                </div>
              </article>
            ))}
          </div>

          {noticias.length === 0 && <div className="public-error">Nenhuma noticia encontrada para o filtro selecionado.</div>}

          <footer className="noticias-pagination">
            <button type="button" className="br-button secondary" disabled={!response?.previous} onClick={() => setPage((old) => Math.max(1, old - 1))}>
              Anterior
            </button>
            <span>
              Pagina {response?.page ?? 1} de {response?.total_pages ?? 1}
            </span>
            <button
              type="button"
              className="br-button secondary"
              disabled={!response?.next}
              onClick={() => setPage((old) => old + 1)}
            >
              Proxima
            </button>
          </footer>
        </>
      )}
    </section>
  );
}

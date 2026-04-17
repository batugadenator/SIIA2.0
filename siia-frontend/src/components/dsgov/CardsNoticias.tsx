import { CmsArtigo } from "../../services/cms";

type CardsNoticiasProps = {
  artigos: CmsArtigo[];
};

function formatPublishedDate(rawDate: string | null): string {
  if (!rawDate) {
    return "Sem data";
  }

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

export default function CardsNoticias({ artigos }: CardsNoticiasProps) {
  return (
    <section className="gov-news-cards" aria-label="Cards de noticias">
      <h2>Ultimas noticias</h2>
      <div className="gov-news-grid">
        {artigos.map((artigo) => (
          <article key={artigo.id} className="gov-news-card">
            <small>{formatPublishedDate(artigo.publicado_em)}</small>
            <h3>{artigo.titulo}</h3>
            <p>{artigo.resumo || artigo.conteudo}</p>
            <a href={artigo.link_externo || "#"} target="_blank" rel="noreferrer">
              Acessar noticia
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

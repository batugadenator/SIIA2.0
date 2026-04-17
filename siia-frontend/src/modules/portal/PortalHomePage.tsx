import { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { CmsCard, CmsNoticia } from "../../services/cms";
import { MosaicoNoticias } from "../../components/dsgov";
import { PublicLayoutContext } from "../../layouts/PublicLayout";

function resolveCardIcon(icone: string): string {
  const mapa: Record<string, string> = {
    folder: "fas fa-folder-open",
    calendar: "fas fa-calendar-alt",
    help: "fas fa-headset",
  };

  return mapa[icone] || "fas fa-link";
}

function buildNoticiasFallback(cards: CmsCard[]): CmsNoticia[] {
  const base = cards.slice(0, 6).map((card, index) => ({
    id: index + 1,
    titulo: card.titulo,
    imagem_url: "",
    categoria_texto: "Portal SIIA",
    data_publicacao: new Date().toISOString(),
    conteudo: card.descricao,
    is_destaque: true,
  }));

  if (base.length >= 6) {
    return base;
  }

  const faltantes = 6 - base.length;
  const complementares = Array.from({ length: faltantes }, (_, index) => ({
    id: 1000 + index,
    titulo: `Destaque Institucional ${index + 1}`,
    imagem_url: "",
    categoria_texto: "Portal SIIA",
    data_publicacao: new Date().toISOString(),
    conteudo: "Atualizacao institucional da Academia Militar das Agulhas Negras.",
    is_destaque: true,
  }));

  return [...base, ...complementares];
}

function getCardTarget(linkUrl: string): "_blank" | "_self" {
  if (/^https?:\/\//i.test(linkUrl)) {
    return "_blank";
  }

  return "_self";
}

const amanCards = [
  { titulo: "Missao e Visao", icon: "fas fa-bullseye" },
  { titulo: "Patronos", icon: "fas fa-landmark" },
  { titulo: "Comandante", icon: "fas fa-user-shield" },
  { titulo: "Historia", icon: "fas fa-book" },
];

export default function PortalHomePage() {
  const { publicData } = useOutletContext<PublicLayoutContext>();

  const listaNoticias = useMemo(() => {
    if (!publicData) {
      return [];
    }

    if (publicData.noticias.length > 0) {
      return publicData.noticias;
    }

    return buildNoticiasFallback(publicData.cards);
  }, [publicData]);

  const centralCards = useMemo(() => publicData?.cards.slice(0, 4) ?? [], [publicData]);

  if (!publicData) {
    return <section className="public-loading">Carregando conteudo do portal...</section>;
  }

  return (
    <div className="portal-home-page">
      <MosaicoNoticias noticias={listaNoticias.slice(0, 6)} />

      <div className="text-center my-4">
        <Link to="/noticias" className="br-button secondary">
          Mais Noticias
        </Link>
      </div>

      <section className="bg-verde-aman py-5">
        <div className="container-lg">
          <h2 className="text-white text-center mb-5">Central de Conteudos</h2>
          <div className="row">
            {centralCards.map((card) => (
              <div key={card.id} className="col-sm-6 col-lg-3 mb-3">
                <a href={card.link_url} target={getCardTarget(card.link_url)} rel="noreferrer" className="card-conteudo br-card d-block">
                  {card.icone_url ? (
                    <img src={card.icone_url} alt="" className="card-conteudo-svg" loading="lazy" />
                  ) : (
                    <i className={resolveCardIcon(card.icone)} aria-hidden="true"></i>
                  )}
                  <h3>{card.titulo}</h3>
                  <p>{card.descricao}</p>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-5 bg-light">
        <div className="container-lg">
          <h2 className="text-center mb-5">A AMAN</h2>
          <div className="row">
            {amanCards.map((item) => (
              <div key={item.titulo} className="col-sm-6 col-lg-3 mb-3">
                <article className="card-aman-light br-card">
                  <i className={item.icon} aria-hidden="true"></i>
                  <h4>{item.titulo}</h4>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

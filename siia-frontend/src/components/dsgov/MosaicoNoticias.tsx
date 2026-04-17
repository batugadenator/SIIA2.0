import React from "react";
import { CmsNoticia } from "../../services/cms";

type MosaicoNoticiasProps = {
  noticias: CmsNoticia[];
};

export default function MosaicoNoticias({ noticias }: MosaicoNoticiasProps) {
  if (!noticias.length) {
    return null;
  }

  const itens = noticias.slice(0, 6);
  const principal = itens[0];
  const topo = itens.slice(1, 3);
  const base = itens.slice(3, 6);

  if (!principal || topo.length < 2 || base.length < 3) {
    return null;
  }

  return (
    <section className="mosaico-noticias-full mt-4" aria-label="Mosaico de noticias">
      <div className="mosaico-noticias-shell">
        <article className="card-mosaico br-card hero">
          {principal.imagem_url ? (
            <img className="card-mosaico-bg" src={principal.imagem_url} alt="" loading="lazy" />
          ) : (
            <div className="card-mosaico-bg card-mosaico-bg-fallback" aria-hidden="true"></div>
          )}
          <div className="overlay">
            <span className="tag-simples">{principal.categoria_texto}</span>
            <h3>{principal.titulo}</h3>
          </div>
        </article>

        <div className="mosaico-noticias-lateral">
          <div className="mosaico-topo">
            {topo.map((item) => (
              <article key={item.id} className="card-mosaico br-card topo-item">
                {item.imagem_url ? (
                  <img className="card-mosaico-bg" src={item.imagem_url} alt="" loading="lazy" />
                ) : (
                  <div className="card-mosaico-bg card-mosaico-bg-fallback" aria-hidden="true"></div>
                )}
                <div className="overlay">
                  <span className="tag-simples">{item.categoria_texto}</span>
                  <p>{item.titulo}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mosaico-base">
            {base.map((item) => (
              <article key={item.id} className="card-mosaico br-card base-item">
                {item.imagem_url ? (
                  <img className="card-mosaico-bg" src={item.imagem_url} alt="" loading="lazy" />
                ) : (
                  <div className="card-mosaico-bg card-mosaico-bg-fallback" aria-hidden="true"></div>
                )}
                <div className="overlay">
                  <span className="tag-simples">{item.categoria_texto}</span>
                  <p>{item.titulo}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

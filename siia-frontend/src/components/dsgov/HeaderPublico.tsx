import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CmsCabecalhoPublico, CmsCabecalhoLink } from "../../services/cms";

type HeaderPublicoProps = {
  cabecalho?: CmsCabecalhoPublico | null;
};

const HeaderPublico: React.FC<HeaderPublicoProps> = ({ cabecalho }) => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRetracted, setIsRetracted] = useState(false);

  const linksTopo = useMemo(() => {
    const links = cabecalho?.links || [];
    return links.slice(0, 12);
  }, [cabecalho?.links]);
  const logoTarget = cabecalho?.link_logo_url || "/";

  useEffect(() => {
    import("@govbr-ds/core/dist/core-init")
      .then(() => {
        const core = (window as any).core;
        if (core && typeof core.init === "function") {
          core.init();
        }
      })
      .catch(() => {
        // In case DSGOV scripts are unavailable, keep header usable without JS enhancements.
      });

    const persisted = localStorage.getItem("siia_theme") || "light";
    const dark = persisted === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("theme-dark", dark);

    const COLLAPSE_AT = 96;
    const EXPAND_AT = 8;
    let ticking = false;
    let rafId = 0;

    const onScroll = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      rafId = window.requestAnimationFrame(() => {
        const y = window.scrollY;
        // Histerese robusta para impedir oscilação na transição de altura do header.
        setIsRetracted((prev) => (prev ? y > EXPAND_AT : y > COLLAPSE_AT));
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("theme-dark", next);
      localStorage.setItem("siia_theme", next ? "dark" : "light");
      return next;
    });
  };

  const renderHeaderLink = (item: CmsCabecalhoLink, index: number) => {
    const isExterno = item.abrir_em_nova_aba;
    const isInterno = item.url?.startsWith("/");
    if (isExterno || !isInterno) {
      return (
        <a
          key={`${item.titulo}-${index}`}
          className="header-top-link"
          href={item.url}
          target={isExterno ? "_blank" : "_self"}
          rel={isExterno ? "noopener noreferrer" : undefined}
          title={item.titulo}
        >
          {item.titulo}
        </a>
      );
    }

    return (
      <Link key={`${item.titulo}-${index}`} className="header-top-link" to={item.url} title={item.titulo}>
        {item.titulo}
      </Link>
    );
  };

  const goToSearch = () => {
    const term = searchTerm.trim();
    if (term) {
      navigate(`/noticias?q=${encodeURIComponent(term)}`);
      return;
    }
    navigate("/noticias");
  };

  return (
    <header className={`br-header mb-4 header-publico-full${isRetracted ? " is-retracted" : ""}`} id="header" data-sticky>
      <div className="header-publico-shell">
        <div className="header-top">
          <div className="header-logo">
            {logoTarget.startsWith("/") ? (
              <Link to={logoTarget} aria-label="Ir para a página inicial" className="header-logo-link">
                <img src={cabecalho?.logo_url || "/assets/logo-aman.png"} alt="Logo AMAN" />
              </Link>
            ) : (
              <a href={logoTarget} className="header-logo-link" aria-label="Ir para a página inicial">
                <img src={cabecalho?.logo_url || "/assets/logo-aman.png"} alt="Logo AMAN" />
              </a>
            )}
            <span className="br-divider vertical mx-half mx-sm-1"></span>
            <Link to={logoTarget.startsWith("/") ? logoTarget : "/"} className="header-sign-link" aria-label="Ir para a página inicial">
              <div className="header-sign">{cabecalho?.nome_instituicao || "Ministerio da Defesa"}</div>
            </Link>
          </div>
          <nav className="header-top-links" aria-label="Links rápidos do portal">
            {linksTopo.map(renderHeaderLink)}
          </nav>
          <div className="header-top-right">
            <span className="br-divider vertical mx-half mx-sm-1"></span>
            <div className="header-theme-toggle">
              <button
                className="br-button circle small"
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
                title={isDark ? "Tema claro" : "Tema escuro"}
              >
                <i className={`fas ${isDark ? "fa-sun" : "fa-adjust"}`} aria-hidden="true"></i>
              </button>
            </div>
            <span className="br-divider vertical mx-half mx-sm-1"></span>
            <div className="header-login">
              <button className="br-button secondary small" type="button" onClick={() => navigate("/login")}>
                <i className="fas fa-user mr-1" aria-hidden="true"></i>
                Entrar
              </button>
            </div>
          </div>
        </div>
        <div className="header-bottom">
          <div className="header-bottom-main">
            <div className="header-menu">
              <div className="header-menu-trigger">
                <button
                  className="br-button small circle"
                  type="button"
                  aria-label="Menu"
                  data-toggle="menu"
                  data-target="#main-navigation"
                >
                  <i className="fas fa-bars" aria-hidden="true"></i>
                </button>
              </div>
              <div className="header-info">
                <div className="header-title">{cabecalho?.nome_orgao || "Exercito Brasileiro"}</div>
                <div className="header-subtitle">{cabecalho?.slogan || "Braco Forte - Mao Amiga"}</div>
              </div>
            </div>

            <div className="header-search">
              <div className="header-search-box" role="search" aria-label="Busca de notícias">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Procurar..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      goToSearch();
                    }
                  }}
                />
                <button
                  className="br-button circle small"
                  type="button"
                  aria-label="Procurar notícias"
                  onClick={goToSearch}
                >
                  <i className="fas fa-search" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderPublico;

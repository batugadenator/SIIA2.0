import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { fetchMePerfilCMS, MePerfilCMS } from "../../services/cms";
import NoticiaListPage from "./noticias/NoticiaListPage";
import NoticiaFormPage from "./noticias/NoticiaFormPage";
import HomologacaoPage from "./workflow/HomologacaoPage";
import MenuAdminPage from "./admin/MenuAdminPage";
import ConfigVisualPage from "./admin/ConfigVisualPage";
import "./cms-admin.css";

export default function CmsDashboardPage() {
  const [perfil, setPerfil] = useState<MePerfilCMS | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetchMePerfilCMS()
      .then(setPerfil)
      .catch(() => setErro("Sem permissão de acesso ao CMS."))
      .finally(() => setCarregando(false));
  }, []);

  if (carregando) return <div className="br-loading" aria-label="Carregando CMS..." />;
  if (erro || !perfil?.perfil_cms)
    return (
      <div className="br-message danger mt-5">
        <i className="fas fa-ban" aria-hidden="true" />
        <span className="ml-2">{erro || "Você não possui permissão para acessar o CMS."}</span>
      </div>
    );

  const isAdmin = perfil.is_admin_cms;
  const podeAutorizar = perfil.pode_autorizar;

  return (
    <div className="cms-shell">
      {/* Sidebar nav */}
      <nav className="br-menu cms-sidebar" aria-label="Navegação do CMS">
        <div className="menu-header cms-sidebar-header">
          <NavLink
            to="/dashboard"
            className="cms-back-link"
          >
            ← Painel de Aplicativos
          </NavLink>
          <div />
          <span className="cms-sidebar-title">
            <i className="fas fa-newspaper mr-1" aria-hidden="true" />
            Painel CMS
          </span>
          <div
            className={`cms-badge ${perfilBadgeClass(perfil.perfil_cms)}`}
          >
            {perfilLabel(perfil.perfil_cms)}
          </div>
        </div>

        <ul className="cms-list-reset">
          <li>
            <NavLink to="noticias" className={navClass} aria-label="Minhas notícias">
              <i className="fas fa-file-alt mr-2" aria-hidden="true" />
              Notícias
            </NavLink>
          </li>
          {podeAutorizar && (
            <li>
              <NavLink to="homologacao" className={navClass} aria-label="Fila de homologação">
                <i className="fas fa-check-circle mr-2" aria-hidden="true" />
                Homologação
              </NavLink>
            </li>
          )}
          {isAdmin && (
            <>
              <li>
                <NavLink to="menus" className={navClass} aria-label="Gerenciar menus">
                  <i className="fas fa-bars mr-2" aria-hidden="true" />
                  Menus do Portal
                </NavLink>
              </li>
              <li>
                <NavLink to="config-visual" className={navClass} aria-label="Ícones SVG">
                  <i className="fas fa-palette mr-2" aria-hidden="true" />
                  Ícones SVG
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Conteúdo */}
      <main className="cms-main">
        <Routes>
          <Route index element={<NoticiaListPage />} />
          <Route path="noticias" element={<NoticiaListPage />} />
          <Route path="noticias/nova" element={<NoticiaFormPage />} />
          <Route path="noticias/:id/editar" element={<NoticiaFormPage />} />
          {podeAutorizar && <Route path="homologacao" element={<HomologacaoPage />} />}
          {isAdmin && (
            <>
              <Route path="menus" element={<MenuAdminPage />} />
              <Route path="config-visual" element={<ConfigVisualPage />} />
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return `br-item${isActive ? " active" : ""}`;
}

function perfilLabel(perfil: string | null) {
  const map: Record<string, string> = {
    admin: "Administrador",
    homologador: "Homologador",
    publicador: "Publicador",
  };
  return perfil ? map[perfil] ?? perfil : "–";
}

function perfilBadgeClass(perfil: string | null) {
  const map: Record<string, string> = {
    admin: "cms-status-publicado",
    homologador: "cms-status-pendente",
    publicador: "cms-status-rascunho",
  };
  return perfil ? map[perfil] ?? "cms-status-rascunho" : "cms-status-rascunho";
}

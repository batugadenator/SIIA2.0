import { Outlet, useLocation } from "react-router-dom";
import FontAwesomeIcon from "../components/FontAwesomeIcon";
import { clearToken } from "../services/auth";
import InternalAppLayout, { InternalAppMenuSection } from "../components/ui/shell/InternalAppLayout";
import "../modules/cadfuncional/src/design-system/styles";

export default function AppLayout() {
  return <ShellLayout />;
}

function ShellLayout() {
  const location = useLocation();
  const isCadFuncional = location.pathname.startsWith("/dashboard/cadfuncional");
  const isSiagg = location.pathname.startsWith("/dashboard/siagg");
  const isCms = location.pathname.startsWith("/dashboard/cms");
  const isLegados = location.pathname.startsWith("/dashboard/legados");

  const handleLogout = () => {
    clearToken();
    window.location.href = "/login";
  };

  const resolveModuleTitle = () => {
    if (isCadFuncional) {
      return "Cadete Funcional";
    }

    if (isSiagg) {
      return "SIAGG";
    }

    if (isCms) {
      return "CMS";
    }

    if (isLegados) {
      return "Sistemas Legados";
    }

    return "Painel de Aplicativos";
  };

  const isDashboardHome = location.pathname === "/dashboard";
  const moduleTitle = resolveModuleTitle();

  const menuSections: InternalAppMenuSection[] = (() => {
    const painelSection: InternalAppMenuSection = {
      title: "Painel",
      items: [
        {
          label: "Visão Geral",
          to: "/dashboard",
          exact: true,
          icon: <FontAwesomeIcon iconClass="fas fa-th" />,
        },
      ],
    };

    if (isCadFuncional) {
      return [
        {
          title: "Painel",
          items: [
            { label: "Dashboard", to: "/dashboard/cadfuncional", exact: true, icon: <FontAwesomeIcon iconClass="fas fa-chart-line" /> },
          ],
        },
        {
          title: "Seção de Saúde",
          items: [
            { label: "Cadetes / Alunos", to: "/dashboard/cadfuncional/cadetes-pacientes", icon: <FontAwesomeIcon iconClass="fas fa-users" /> },
          ],
        },
        {
          title: "Módulos",
          items: [
            { label: "Médico", to: "/dashboard/cadfuncional/medico", icon: <FontAwesomeIcon iconClass="fas fa-user-md" /> },
            { label: "Fisioterapia", to: "/dashboard/cadfuncional/fisioterapia", icon: <FontAwesomeIcon iconClass="fas fa-running" /> },
            { label: "Profissional de Educação Física", to: "/dashboard/cadfuncional/educador-fisico", icon: <FontAwesomeIcon iconClass="fas fa-dumbbell" /> },
            { label: "Nutrição", to: "/dashboard/cadfuncional/nutricao", icon: <FontAwesomeIcon iconClass="fas fa-apple-alt" /> },
            { label: "Psicopedagogo", to: "/dashboard/cadfuncional/psicopedagogia", icon: <FontAwesomeIcon iconClass="fas fa-brain" /> },
            { label: "Instrutor", to: "/dashboard/cadfuncional/instrutor", icon: <FontAwesomeIcon iconClass="fas fa-chalkboard-teacher" /> },
            { label: "Relatórios S-RED", to: "/dashboard/cadfuncional/sred", icon: <FontAwesomeIcon iconClass="fas fa-clipboard-check" /> },
          ],
        },
        {
          title: "Configurações",
          items: [
            { label: "Configurações Gerais", to: "/dashboard/cadfuncional/configuracoes-gerais", icon: <FontAwesomeIcon iconClass="fas fa-cog" /> },
          ],
        },
        {
          title: "Minha Conta",
          items: [
            { label: "Minha Conta", to: "/dashboard/cadfuncional/minha-conta", icon: <FontAwesomeIcon iconClass="fas fa-user-circle" /> },
          ],
        },
      ];
    }

    if (isCms) {
      return [
        painelSection,
        {
          title: "CMS",
          items: [
            { label: "Notícias", to: "/dashboard/cms/noticias", icon: <FontAwesomeIcon iconClass="fas fa-newspaper" /> },
            { label: "Homologação", to: "/dashboard/cms/homologacao", icon: <FontAwesomeIcon iconClass="fas fa-check-circle" /> },
            { label: "Menus", to: "/dashboard/cms/menus", icon: <FontAwesomeIcon iconClass="fas fa-bars" /> },
            { label: "Cabeçalho", to: "/dashboard/cms/cabecalho", icon: <FontAwesomeIcon iconClass="fas fa-heading" /> },
            { label: "Configuração Visual", to: "/dashboard/cms/config-visual", icon: <FontAwesomeIcon iconClass="fas fa-palette" /> },
          ],
        },
      ];
    }

    if (isSiagg) {
      return [
        {
          title: "SIAGG",
          items: [
            { label: "Painel", to: "/dashboard/siagg", exact: true, icon: <FontAwesomeIcon iconClass="fas fa-chart-pie" /> },
            { label: "Relatorios", to: "/dashboard/siagg/relatorios", icon: <FontAwesomeIcon iconClass="fas fa-file-alt" /> },
            { label: "Governanca", to: "/dashboard/siagg/governanca", icon: <FontAwesomeIcon iconClass="fas fa-folder-open" /> },
            { label: "PNCP", to: "/dashboard/siagg/pncp", icon: <FontAwesomeIcon iconClass="fas fa-database" /> },
          ],
        },
      ];
    }

    return [
      painelSection,
      {
        title: "Aplicativos",
        items: [
          {
            label: "Cadete Funcional",
            to: "/dashboard/cadfuncional",
            icon: <FontAwesomeIcon iconClass="fas fa-dumbbell" />,
          },
          {
            label: "SIAGG",
            to: "/dashboard/siagg",
            icon: <FontAwesomeIcon iconClass="fas fa-database" />,
          },
          {
            label: "CMS",
            to: "/dashboard/cms/noticias",
            icon: <FontAwesomeIcon iconClass="fas fa-newspaper" />,
          },
          {
            label: "Sistemas Legados",
            to: "/dashboard/legados",
            icon: <FontAwesomeIcon iconClass="fas fa-project-diagram" />,
          },
        ],
      },
    ];
  })();

  return (
    <InternalAppLayout
      moduleTitle={moduleTitle}
      moduleSubtitle="Area logada"
      brandName="SIIA 2.0"
      brandLogoSrc="/logo-cadfuncional-aman.png"
      brandLogoAlt="SIIA 2.0"
      menuItems={menuSections}
      showBackButton={!isDashboardHome}
      backTo="/dashboard"
      backLabel="Voltar"
      onLogout={handleLogout}
    >
      <Outlet />
    </InternalAppLayout>
  );
}

import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./modules/auth/ProtectedRoute";
import "./App.css";

const PublicLayout = lazy(() => import("./layouts/PublicLayout"));
const AppLayout = lazy(() => import("./layouts/AppLayout"));
const AppsDashboardPage = lazy(() => import("./modules/apps/AppsDashboardPage"));
const LegadosLayout = lazy(() => import("./modules/apps/LegadosLayout"));
const PortalHomePage = lazy(() => import("./modules/portal/PortalHomePage"));
const PortalNoticiasPage = lazy(() => import("./modules/portal/PortalNoticiasPage"));
const LoginPage = lazy(() => import("./modules/auth/LoginPage"));
const CadFuncionalDashboardPage = lazy(() => import("./modules/cadfuncional/CadFuncionalDashboardPage"));
const CadFuncionalDashPage = lazy(() => import("./modules/cadfuncional/src/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const CadFuncionalMedicoPage = lazy(() => import("./modules/cadfuncional/src/pages/MedicoPage").then((module) => ({ default: module.MedicoPage })));
const CadFuncionalMedicoDetalhesPage = lazy(() => import("./modules/cadfuncional/src/pages/MedicoAtendimentoDetalhesPage").then((module) => ({ default: module.MedicoAtendimentoDetalhesPage })));
const CadFuncionalCadetesPacientesPage = lazy(() => import("./modules/cadfuncional/src/pages/CadetesPacientesPage").then((module) => ({ default: module.CadetesPacientesPage })));
const CadFuncionalCadastrarCadetePage = lazy(() => import("./modules/cadfuncional/src/pages/CadastrarCadetePage").then((module) => ({ default: module.CadastrarCadetePage })));
const CadFuncionalNovoAtendimentoPage = lazy(() => import("./modules/cadfuncional/src/pages/NovoAtendimentoPage").then((module) => ({ default: module.NovoAtendimentoPage })));
const CadFuncionalFisioterapeutaPage = lazy(() => import("./modules/cadfuncional/src/pages/FisioterapeutaPage").then((module) => ({ default: module.FisioterapeutaPage })));
const CadFuncionalEspecialidadeDetalhesPage = lazy(() => import("./modules/cadfuncional/src/pages/EspecialidadeAtendimentoDetalhesPage").then((module) => ({ default: module.EspecialidadeAtendimentoDetalhesPage })));
const CadFuncionalFichaAvaliacaoSredPage = lazy(() => import("./modules/cadfuncional/src/pages/FichaAvaliacaoSredPage").then((module) => ({ default: module.FichaAvaliacaoSredPage })));
const CadFuncionalEducadorFisicoPage = lazy(() => import("./modules/cadfuncional/src/pages/EducadorFisicoPage").then((module) => ({ default: module.EducadorFisicoPage })));
const CadFuncionalNutricionistaPage = lazy(() => import("./modules/cadfuncional/src/pages/NutricionistaPage").then((module) => ({ default: module.NutricionistaPage })));
const CadFuncionalPsicopedagogoPage = lazy(() => import("./modules/cadfuncional/src/pages/PsicopedagogoPage").then((module) => ({ default: module.PsicopedagogoPage })));
const CadFuncionalInstrutorPage = lazy(() => import("./modules/cadfuncional/src/pages/InstrutorPage").then((module) => ({ default: module.InstrutorPage })));
const CadFuncionalSredPage = lazy(() => import("./modules/cadfuncional/src/pages/sredPage").then((module) => ({ default: module.SredPage })));
const CadFuncionalMinhaContaPage = lazy(() => import("./modules/cadfuncional/src/pages/MinhaContaPage").then((module) => ({ default: module.MinhaContaPage })));
const CadFuncionalUsuariosPerfisPage = lazy(() => import("./modules/cadfuncional/src/pages/UsuariosPerfisPage").then((module) => ({ default: module.UsuariosPerfisPage })));
const CadFuncionalConfigGeralPage = lazy(() => import("./modules/cadfuncional/src/pages/ConfigGeral").then((module) => ({ default: module.ConfigGeralPage })));
const CadFuncionalConfiguracaoLdapPage = lazy(() => import("./modules/cadfuncional/src/pages/ConfiguracaoLdapPage").then((module) => ({ default: module.ConfiguracaoLdapPage })));
const CadFuncionalImportarCSVPage = lazy(() => import("./modules/cadfuncional/src/pages/ImportarCSVPage").then((module) => ({ default: module.ImportarCSVPage })));
const CadFuncionalCargaReferenciasPage = lazy(() => import("./modules/cadfuncional/src/pages/CargaReferenciasPage").then((module) => ({ default: module.CargaReferenciasPage })));
const SiaggLayout = lazy(() => import("./modules/siagg/SiaggLayout"));
const SiaggDashboardPage = lazy(() => import("./modules/siagg/SiaggDashboardPage"));
const SiaggAreaDetailPage = lazy(() => import("./modules/siagg/pages/SiaggAreaDetailPage"));
const SiaggReportsPage = lazy(() => import("./modules/siagg/pages/SiaggReportsPage"));
const SiaggGovernancePage = lazy(() => import("./modules/siagg/pages/SiaggGovernancePage"));
const SiaggPncpPage = lazy(() => import("./modules/siagg/pages/SiaggPncpPage"));
const CmsLayout = lazy(() => import("./modules/cms/CmsLayout"));
const NoticiaListPage = lazy(() => import("./modules/cms/noticias/NoticiaListPage"));
const NoticiaFormPage = lazy(() => import("./modules/cms/noticias/NoticiaFormPage"));
const HomologacaoPage = lazy(() => import("./modules/cms/workflow/HomologacaoPage"));
const MenuAdminPage = lazy(() => import("./modules/cms/admin/MenuAdminPage"));
const HeaderAdminPage = lazy(() => import("./modules/cms/admin/HeaderAdminPage"));
const ConfigVisualPage = lazy(() => import("./modules/cms/admin/ConfigVisualPage"));

function RouteFallback() {
  return (
    <div className="route-fallback">
      Carregando...
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<PortalHomePage />} />
          <Route path="/noticias" element={<PortalNoticiasPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<AppsDashboardPage />} />
          <Route path="cadfuncional" element={<CadFuncionalDashboardPage />}>
            <Route index element={<CadFuncionalDashPage />} />
            <Route path="medico" element={<CadFuncionalMedicoPage />} />
            <Route path="medico/paciente/:cadeteId" element={<CadFuncionalMedicoDetalhesPage />} />
            <Route path="cadetes-pacientes" element={<CadFuncionalCadetesPacientesPage />} />
            <Route path="cadetes/novo" element={<CadFuncionalCadastrarCadetePage />} />
            <Route path="atendimentos/novo" element={<CadFuncionalNovoAtendimentoPage />} />
            <Route path="fisioterapia" element={<CadFuncionalFisioterapeutaPage />} />
            <Route path="fisioterapia/atendimento/:atendimentoId/detalhes" element={<CadFuncionalEspecialidadeDetalhesPage modulo="fisioterapia" />} />
            <Route path="fisioterapia/avaliacao-sred/:atendimentoId" element={<CadFuncionalFichaAvaliacaoSredPage />} />
            <Route path="educador-fisico" element={<CadFuncionalEducadorFisicoPage />} />
            <Route path="educador-fisico/atendimento/:atendimentoId/detalhes" element={<CadFuncionalEspecialidadeDetalhesPage modulo="educador-fisico" />} />
            <Route path="nutricao" element={<CadFuncionalNutricionistaPage />} />
            <Route path="nutricao/atendimento/:atendimentoId/detalhes" element={<CadFuncionalEspecialidadeDetalhesPage modulo="nutricao" />} />
            <Route path="psicopedagogia" element={<CadFuncionalPsicopedagogoPage />} />
            <Route path="psicopedagogia/atendimento/:atendimentoId/detalhes" element={<CadFuncionalEspecialidadeDetalhesPage modulo="psicopedagogia" />} />
            <Route path="instrutor" element={<CadFuncionalInstrutorPage />} />
            <Route path="instrutor/atendimento/:atendimentoId/detalhes" element={<CadFuncionalEspecialidadeDetalhesPage modulo="instrutor" />} />
            <Route path="sred" element={<CadFuncionalSredPage />} />
            <Route path="minha-conta" element={<CadFuncionalMinhaContaPage />} />
            <Route path="usuarios-perfis" element={<CadFuncionalUsuariosPerfisPage />} />
            <Route path="configuracoes-gerais" element={<CadFuncionalConfigGeralPage />} />
            <Route path="configuracao-ldap" element={<CadFuncionalConfiguracaoLdapPage />} />
            <Route path="importar-csv" element={<CadFuncionalImportarCSVPage />} />
            <Route path="carga-referencias" element={<CadFuncionalCargaReferenciasPage />} />
          </Route>
          <Route path="siagg" element={<SiaggLayout />}>
            <Route index element={<SiaggDashboardPage />} />
            <Route path="areas/:areaId" element={<SiaggAreaDetailPage />} />
            <Route path="relatorios" element={<SiaggReportsPage />} />
            <Route path="governanca" element={<SiaggGovernancePage />} />
            <Route path="pncp" element={<SiaggPncpPage />} />
          </Route>
          <Route path="cms" element={<CmsLayout />}>
            <Route index element={<Navigate to="noticias" replace />} />
            <Route path="noticias" element={<NoticiaListPage />} />
            <Route path="noticias/nova" element={<NoticiaFormPage />} />
            <Route path="noticias/:id/editar" element={<NoticiaFormPage />} />
            <Route path="homologacao" element={<HomologacaoPage />} />
            <Route path="menus" element={<MenuAdminPage />} />
            <Route path="cabecalho" element={<HeaderAdminPage />} />
            <Route path="config-visual" element={<ConfigVisualPage />} />
          </Route>
          <Route path="legados" element={<LegadosLayout />}>
            <Route index element={<AppsDashboardPage section="legados" />} />
          </Route>
        </Route>

        <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

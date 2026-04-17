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
const ReabilitaDashboardPage = lazy(() => import("./modules/reabilita/ReabilitaDashboardPage"));
const ReabilitaDashPage = lazy(() => import("./modules/reabilita/src/pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const ReabilitaMedicoPage = lazy(() => import("./modules/reabilita/src/pages/MedicoPage").then((module) => ({ default: module.MedicoPage })));
const ReabilitaMedicoDetalhesPage = lazy(() => import("./modules/reabilita/src/pages/MedicoAtendimentoDetalhesPage").then((module) => ({ default: module.MedicoAtendimentoDetalhesPage })));
const ReabilitaCadetesPacientesPage = lazy(() => import("./modules/reabilita/src/pages/CadetesPacientesPage").then((module) => ({ default: module.CadetesPacientesPage })));
const ReabilitaCadastrarCadetePage = lazy(() => import("./modules/reabilita/src/pages/CadastrarCadetePage").then((module) => ({ default: module.CadastrarCadetePage })));
const ReabilitaNovoAtendimentoPage = lazy(() => import("./modules/reabilita/src/pages/NovoAtendimentoPage").then((module) => ({ default: module.NovoAtendimentoPage })));
const ReabilitaFisioterapeutaPage = lazy(() => import("./modules/reabilita/src/pages/FisioterapeutaPage").then((module) => ({ default: module.FisioterapeutaPage })));
const ReabilitaEspecialidadeDetalhesPage = lazy(() => import("./modules/reabilita/src/pages/EspecialidadeAtendimentoDetalhesPage").then((module) => ({ default: module.EspecialidadeAtendimentoDetalhesPage })));
const ReabilitaFichaAvaliacaoSredPage = lazy(() => import("./modules/reabilita/src/pages/FichaAvaliacaoSredPage").then((module) => ({ default: module.FichaAvaliacaoSredPage })));
const ReabilitaEducadorFisicoPage = lazy(() => import("./modules/reabilita/src/pages/EducadorFisicoPage").then((module) => ({ default: module.EducadorFisicoPage })));
const ReabilitaNutricionistaPage = lazy(() => import("./modules/reabilita/src/pages/NutricionistaPage").then((module) => ({ default: module.NutricionistaPage })));
const ReabilitaPsicopedagogoPage = lazy(() => import("./modules/reabilita/src/pages/PsicopedagogoPage").then((module) => ({ default: module.PsicopedagogoPage })));
const ReabilitaInstrutorPage = lazy(() => import("./modules/reabilita/src/pages/InstrutorPage").then((module) => ({ default: module.InstrutorPage })));
const ReabilitaSredPage = lazy(() => import("./modules/reabilita/src/pages/sredPage").then((module) => ({ default: module.SredPage })));
const ReabilitaMinhaContaPage = lazy(() => import("./modules/reabilita/src/pages/MinhaContaPage").then((module) => ({ default: module.MinhaContaPage })));
const ReabilitaUsuariosPerfisPage = lazy(() => import("./modules/reabilita/src/pages/UsuariosPerfisPage").then((module) => ({ default: module.UsuariosPerfisPage })));
const ReabilitaConfigGeralPage = lazy(() => import("./modules/reabilita/src/pages/ConfigGeral").then((module) => ({ default: module.ConfigGeralPage })));
const ReabilitaConfiguracaoLdapPage = lazy(() => import("./modules/reabilita/src/pages/ConfiguracaoLdapPage").then((module) => ({ default: module.ConfiguracaoLdapPage })));
const ReabilitaImportarCSVPage = lazy(() => import("./modules/reabilita/src/pages/ImportarCSVPage").then((module) => ({ default: module.ImportarCSVPage })));
const ReabilitaCargaReferenciasPage = lazy(() => import("./modules/reabilita/src/pages/CargaReferenciasPage").then((module) => ({ default: module.CargaReferenciasPage })));
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
          <Route path="reabilita" element={<ReabilitaDashboardPage />}>
            <Route index element={<ReabilitaDashPage />} />
            <Route path="medico" element={<ReabilitaMedicoPage />} />
            <Route path="medico/paciente/:cadeteId" element={<ReabilitaMedicoDetalhesPage />} />
            <Route path="cadetes-pacientes" element={<ReabilitaCadetesPacientesPage />} />
            <Route path="cadetes/novo" element={<ReabilitaCadastrarCadetePage />} />
            <Route path="atendimentos/novo" element={<ReabilitaNovoAtendimentoPage />} />
            <Route path="fisioterapia" element={<ReabilitaFisioterapeutaPage />} />
            <Route path="fisioterapia/atendimento/:atendimentoId/detalhes" element={<ReabilitaEspecialidadeDetalhesPage modulo="fisioterapia" />} />
            <Route path="fisioterapia/avaliacao-sred/:atendimentoId" element={<ReabilitaFichaAvaliacaoSredPage />} />
            <Route path="educador-fisico" element={<ReabilitaEducadorFisicoPage />} />
            <Route path="educador-fisico/atendimento/:atendimentoId/detalhes" element={<ReabilitaEspecialidadeDetalhesPage modulo="educador-fisico" />} />
            <Route path="nutricao" element={<ReabilitaNutricionistaPage />} />
            <Route path="nutricao/atendimento/:atendimentoId/detalhes" element={<ReabilitaEspecialidadeDetalhesPage modulo="nutricao" />} />
            <Route path="psicopedagogia" element={<ReabilitaPsicopedagogoPage />} />
            <Route path="psicopedagogia/atendimento/:atendimentoId/detalhes" element={<ReabilitaEspecialidadeDetalhesPage modulo="psicopedagogia" />} />
            <Route path="instrutor" element={<ReabilitaInstrutorPage />} />
            <Route path="instrutor/atendimento/:atendimentoId/detalhes" element={<ReabilitaEspecialidadeDetalhesPage modulo="instrutor" />} />
            <Route path="sred" element={<ReabilitaSredPage />} />
            <Route path="minha-conta" element={<ReabilitaMinhaContaPage />} />
            <Route path="usuarios-perfis" element={<ReabilitaUsuariosPerfisPage />} />
            <Route path="configuracoes-gerais" element={<ReabilitaConfigGeralPage />} />
            <Route path="configuracao-ldap" element={<ReabilitaConfiguracaoLdapPage />} />
            <Route path="importar-csv" element={<ReabilitaImportarCSVPage />} />
            <Route path="carga-referencias" element={<ReabilitaCargaReferenciasPage />} />
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

import { CircularProgress, Stack } from '@mui/material';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { canAccessRoute } from './accessControl';

import { ClinicalLayout } from '../components/common/ClinicalLayout';
import { MedicoPage } from '../pages/MedicoPage';
import { MedicoAtendimentoDetalhesPage } from '../pages/MedicoAtendimentoDetalhesPage';
import { CadetesPacientesPage } from '../pages/CadetesPacientesPage';
import { CadastrarCadetePage } from '../pages/CadastrarCadetePage';
import { CargaReferenciasPage } from '../pages/CargaReferenciasPage';
import { ConfigGeralPage } from '../pages/ConfigGeral';
import { ConfiguracaoLdapPage } from '../pages/ConfiguracaoLdapPage';
import { DashboardPage } from '../pages/DashboardPage';
import { EducadorFisicoPage } from '../pages/EducadorFisicoPage';
import { EspecialidadeAtendimentoDetalhesPage } from '../pages/EspecialidadeAtendimentoDetalhesPage';
import { FisioterapeutaPage } from '../pages/FisioterapeutaPage';
import { FichaAvaliacaoSredPage } from '../pages/FichaAvaliacaoSredPage';
import { ImportarCSVPage } from '../pages/ImportarCSVPage';
import { InstrutorPage } from '../pages/InstrutorPage';
import { LoginPage } from '../pages/LoginPage';
import { MinhaContaPage } from '../pages/MinhaContaPage';
import { NovoAtendimentoPage } from '../pages/NovoAtendimentoPage';
import { NutricionistaPage } from '../pages/NutricionistaPage';
import { PsicopedagogoPage } from '../pages/PsicopedagogoPage';
import { SredPage } from '../pages/sredPage';
import { UsuariosPerfisPage } from '../pages/UsuariosPerfisPage';
import { useAuth } from '../providers/AuthProvider';

const ProtectedLayoutRoute = () => {
	const { isReady, isAuthenticated } = useAuth();

	if (!isReady) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="100vh">
				<CircularProgress />
			</Stack>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <ClinicalLayout />;
};

const PublicLoginRoute = () => {
	const { isReady, isAuthenticated } = useAuth();

	if (!isReady) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="100vh">
				<CircularProgress />
			</Stack>
		);
	}

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	return <LoginPage />;
};

interface ProtectedPageRouteProps {
	path: string;
	element: JSX.Element;
}

const ProtectedPageRoute = ({ path, element }: ProtectedPageRouteProps) => {
	const { user } = useAuth();
	if (!canAccessRoute(user?.perfil, path)) {
		return <Navigate to="/dashboard" replace />;
	}
	return element;
};

export const App = () => {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/login" element={<PublicLoginRoute />} />
				<Route element={<ProtectedLayoutRoute />}>
					<Route path="/" element={<Navigate to="/dashboard" replace />} />
					<Route path="/dashboard" element={<ProtectedPageRoute path="/dashboard" element={<DashboardPage />} />} />
					<Route path="/medico" element={<ProtectedPageRoute path="/medico" element={<MedicoPage />} />} />
					<Route
						path="/medico/paciente/:cadeteId"
						element={
							<ProtectedPageRoute
								path="/medico/paciente/:cadeteId"
								element={<MedicoAtendimentoDetalhesPage />}
							/>
						}
					/>
					<Route
						path="/instrutor"
						element={<ProtectedPageRoute path="/instrutor" element={<InstrutorPage />} />}
					/>
					<Route
						path="/cadetes-pacientes"
						element={<ProtectedPageRoute path="/cadetes-pacientes" element={<CadetesPacientesPage />} />}
					/>
					<Route path="/cadetes/novo" element={<ProtectedPageRoute path="/cadetes/novo" element={<CadastrarCadetePage />} />} />
					<Route
						path="/atendimentos/novo"
						element={<ProtectedPageRoute path="/atendimentos/novo" element={<NovoAtendimentoPage />} />}
					/>
					<Route path="/fisioterapia" element={<ProtectedPageRoute path="/fisioterapia" element={<FisioterapeutaPage />} />} />
					<Route
						path="/fisioterapia/atendimento/:atendimentoId/detalhes"
						element={
							<ProtectedPageRoute
								path="/fisioterapia/atendimento/:atendimentoId/detalhes"
								element={<EspecialidadeAtendimentoDetalhesPage modulo="fisioterapia" />}
							/>
						}
					/>
					<Route
						path="/fisioterapia/avaliacao-sred/:atendimentoId"
						element={
							<ProtectedPageRoute
								path="/fisioterapia/avaliacao-sred/:atendimentoId"
								element={<FichaAvaliacaoSredPage />}
							/>
						}
					/>
					<Route
						path="/educador-fisico"
						element={<ProtectedPageRoute path="/educador-fisico" element={<EducadorFisicoPage />} />}
					/>
					<Route
						path="/educador-fisico/atendimento/:atendimentoId/detalhes"
						element={
							<ProtectedPageRoute
								path="/educador-fisico/atendimento/:atendimentoId/detalhes"
								element={<EspecialidadeAtendimentoDetalhesPage modulo="educador-fisico" />}
							/>
						}
					/>
					<Route path="/nutricao" element={<ProtectedPageRoute path="/nutricao" element={<NutricionistaPage />} />} />
					<Route
						path="/nutricao/atendimento/:atendimentoId/detalhes"
						element={
							<ProtectedPageRoute
								path="/nutricao/atendimento/:atendimentoId/detalhes"
								element={<EspecialidadeAtendimentoDetalhesPage modulo="nutricao" />}
							/>
						}
					/>
					<Route
						path="/psicopedagogia"
						element={<ProtectedPageRoute path="/psicopedagogia" element={<PsicopedagogoPage />} />}
					/>
					<Route
						path="/psicopedagogia/atendimento/:atendimentoId/detalhes"
						element={
							<ProtectedPageRoute
								path="/psicopedagogia/atendimento/:atendimentoId/detalhes"
								element={<EspecialidadeAtendimentoDetalhesPage modulo="psicopedagogia" />}
							/>
						}
					/>
					<Route
						path="/instrutor/atendimento/:atendimentoId/detalhes"
						element={
							<ProtectedPageRoute
								path="/instrutor/atendimento/:atendimentoId/detalhes"
								element={<EspecialidadeAtendimentoDetalhesPage modulo="instrutor" />}
							/>
						}
					/>
					<Route path="/sred" element={<ProtectedPageRoute path="/sred" element={<SredPage />} />} />
					<Route path="/minha-conta" element={<ProtectedPageRoute path="/minha-conta" element={<MinhaContaPage />} />} />
					<Route
						path="/usuarios-perfis"
						element={<ProtectedPageRoute path="/usuarios-perfis" element={<UsuariosPerfisPage />} />}
					/>
					<Route
						path="/configuracoes-gerais"
						element={<ProtectedPageRoute path="/configuracoes-gerais" element={<ConfigGeralPage />} />}
					/>
					<Route
						path="/configuracao-ldap"
						element={<ProtectedPageRoute path="/configuracao-ldap" element={<ConfiguracaoLdapPage />} />}
					/>
					<Route path="/importar-csv" element={<ProtectedPageRoute path="/importar-csv" element={<ImportarCSVPage />} />} />
					<Route
						path="/carga-referencias"
						element={<ProtectedPageRoute path="/carga-referencias" element={<CargaReferenciasPage />} />}
					/>
					<Route path="*" element={<Navigate to="/dashboard" replace />} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
};

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import {
	Box,
	Button,
	Divider,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
} from '@mui/material';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { canAccessRoute } from '../../app/accessControl';
import { useAuth } from '../../providers/AuthProvider';
import { useThemeMode } from '../../providers/AppProviders';

const isCurrentRoute = (currentPath: string, targetPath: string): boolean => {
	return currentPath === targetPath;
};

const CADFUNCIONAL_BASE = '/dashboard/cadfuncional';

export const ClinicalLayout = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { mode, toggleMode } = useThemeMode();
	const { logout, user } = useAuth();
	const perfil = user?.perfil;

	const canDashboard = canAccessRoute(perfil, '/dashboard');
	const canCadetesPacientes = canAccessRoute(perfil, '/cadetes-pacientes');
	const canMedico = canAccessRoute(perfil, '/medico');
	const canInstrutor = canAccessRoute(perfil, '/instrutor');
	const canFisioterapia = canAccessRoute(perfil, '/fisioterapia');
	const canEducadorFisico = canAccessRoute(perfil, '/educador-fisico');
	const canNutricao = canAccessRoute(perfil, '/nutricao');
	const canPsicopedagogia = canAccessRoute(perfil, '/psicopedagogia');
	const canSred = canAccessRoute(perfil, '/sred');
	const canMinhaConta = canAccessRoute(perfil, '/minha-conta');
	const canConfiguracoesGerais = canAccessRoute(perfil, '/configuracoes-gerais');
	const canNovoAtendimento = canAccessRoute(perfil, '/atendimentos/novo');
	const hasSaudeSection = canCadetesPacientes;
	const hasModulosSection =
		canMedico || canInstrutor || canFisioterapia || canEducadorFisico || canNutricao || canPsicopedagogia || canSred;
	const hasConfiguracoesSection = canConfiguracoesGerais;
	const hasContaSection = canMinhaConta;
	const handleLogout = async () => {
		await logout();
		navigate('/login', { replace: true });
	};

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
			<Stack direction={{ xs: 'column', md: 'row' }} minHeight="100vh">
				<Box
					component="aside"
					sx={{
						width: { xs: '100%', md: 280 },
						borderRight: { md: 1 },
						borderBottom: { xs: 1, md: 0 },
						borderColor: 'divider',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					<Stack
						direction="row"
						alignItems="center"
						spacing={1.5}
						px={2}
						py={2}
						component={RouterLink}
						to={CADFUNCIONAL_BASE}
						sx={{ textDecoration: 'none', color: 'inherit', width: 'fit-content' }}
					>
						<Box
							component="img"
							src="/logo-cadfuncional-aman.png"
							alt="Logotipo Cadete Funcional"
							sx={{ width: 40, height: 40, objectFit: 'contain' }}
						/>
						<Typography variant="h6" fontWeight={700} lineHeight={1} sx={{ letterSpacing: 0.2 }}>
							Cadete Funcional
						</Typography>
					</Stack>

					<Divider />

				<List sx={{ px: 1, py: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
					<ListItem disablePadding>
						<ListItemButton
							component={RouterLink}
							to="/dashboard"
							sx={{
								minHeight: 40,
								borderRadius: 1,
								color: 'text.secondary',
								'&:hover': { color: 'primary.main' },
							}}
						>
							<ListItemIcon sx={{ minWidth: 36 }}>
								<ArrowBackOutlinedIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText
								primary="Painel de Aplicativos"
								primaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
							/>
						</ListItemButton>
					</ListItem>

					<Divider sx={{ my: 0.5 }} />

					<List sx={{ px: 0, py: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
						{canDashboard && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={CADFUNCIONAL_BASE}
									selected={isCurrentRoute(location.pathname, CADFUNCIONAL_BASE)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<DashboardOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Dashboard" />
								</ListItemButton>
							</ListItem>
						)}

						{hasSaudeSection && (
							<ListItem sx={{ pt: 1, pb: 0.5 }}>
								<Typography variant="caption" color="text.secondary" fontWeight={600}>
									Seção de Saúde
								</Typography>
							</ListItem>
						)}

						{canCadetesPacientes && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/cadetes-pacientes`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/cadetes-pacientes`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<GroupOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Cadetes / Alunos" />
								</ListItemButton>
							</ListItem>
						)}

						{hasModulosSection && (
							<ListItem sx={{ pt: 1, pb: 0.5 }}>
								<Typography variant="caption" color="text.secondary" fontWeight={600}>
									Módulos
								</Typography>
							</ListItem>
						)}

						{canMedico && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/medico`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/medico`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<MedicalServicesOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Médico" />
								</ListItemButton>
							</ListItem>
						)}

						{canFisioterapia && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/fisioterapia`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/fisioterapia`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<SpaOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Fisioterapia" />
								</ListItemButton>
							</ListItem>
						)}

						{canEducadorFisico && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/educador-fisico`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/educador-fisico`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<FitnessCenterOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Profissional de Educação Física" />
								</ListItemButton>
							</ListItem>
						)}

						{canNutricao && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/nutricao`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/nutricao`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<RestaurantOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Nutrição" />
								</ListItemButton>
							</ListItem>
						)}

						{canPsicopedagogia && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/psicopedagogia`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/psicopedagogia`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<PsychologyOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Psicopedagogo" />
								</ListItemButton>
							</ListItem>
						)}

						{canInstrutor && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/instrutor`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/instrutor`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<TimelineOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Instrutor" />
								</ListItemButton>
							</ListItem>
						)}

						{canSred && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/sred`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/sred`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<SummarizeOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Relatórios S-RED" />
								</ListItemButton>
							</ListItem>
						)}

						{hasConfiguracoesSection && (
							<ListItem sx={{ pt: 1, pb: 0.5 }}>
								<Typography variant="caption" color="text.secondary" fontWeight={600}>
									Configurações
								</Typography>
							</ListItem>
						)}

						{canConfiguracoesGerais && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/configuracoes-gerais`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/configuracoes-gerais`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<SettingsOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Configurações Gerais" />
								</ListItemButton>
							</ListItem>
						)}

						{hasContaSection && (
							<ListItem sx={{ pt: 1, pb: 0.5 }}>
								<Typography variant="caption" color="text.secondary" fontWeight={600}>
									Minha Conta
								</Typography>
							</ListItem>
						)}

						{canMinhaConta && (
							<ListItem disablePadding>
								<ListItemButton
									component={RouterLink}
									to={`${CADFUNCIONAL_BASE}/minha-conta`}
									selected={isCurrentRoute(location.pathname, `${CADFUNCIONAL_BASE}/minha-conta`)}
									sx={{ minHeight: 44 }}
								>
									<ListItemIcon>
										<PersonOutlineOutlinedIcon />
									</ListItemIcon>
									<ListItemText primary="Minha Conta" />
								</ListItemButton>
							</ListItem>
						)}

						<ListItem disablePadding sx={{ mt: 1 }}>
							<ListItemButton onClick={toggleMode} sx={{ minHeight: 44 }}>
								<ListItemIcon>
									{mode === 'light' ? <DarkModeOutlinedIcon /> : <WbSunnyOutlinedIcon />}
								</ListItemIcon>
								<ListItemText
									primary={mode === 'light' ? 'Modo escuro' : 'Modo claro'}
								/>
							</ListItemButton>
						</ListItem>

						<ListItem disablePadding>
							<ListItemButton onClick={() => void handleLogout()} sx={{ minHeight: 44 }}>
								<ListItemIcon>
									<LogoutOutlinedIcon />
								</ListItemIcon>
								<ListItemText primary="Sair" />
							</ListItemButton>
						</ListItem>
					</List>
				</List>
				</Box>

				<Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
					<Box
						component="header"
						sx={{
							borderBottom: 1,
							borderColor: 'divider',
							px: { xs: 2, md: 3 },
							py: 1.5,
						}}
					>
						<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={1}>
							{canNovoAtendimento && (
								<Button
									variant="contained"
									component={RouterLink}
										to={`${CADFUNCIONAL_BASE}/atendimentos/novo`}
									sx={{ minHeight: 44, minWidth: 44 }}
								>
									+ Novo Atendimento
								</Button>
							)}
						</Stack>
					</Box>

					<Box component="main" sx={{ flex: 1, px: { xs: 2, md: 3 }, py: 2 }}>
						<Outlet />
					</Box>
				</Box>
			</Stack>
		</Box>
	);
};

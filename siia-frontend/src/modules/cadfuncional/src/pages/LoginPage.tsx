import { useEffect, useState, type FormEvent } from 'react';

import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import {
	Alert,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	FormControlLabel,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

import { SectionCard } from '../design-system';
import { useThemeMode } from '../providers/AppProviders';
import { useAuth } from '../providers/AuthProvider';

export const LoginPage = () => {
	const navigate = useNavigate();
	const { mode, toggleMode } = useThemeMode();
	const { isReady, isAuthenticated, isAuthenticating, loginError, login } = useAuth();
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [logoSrc, setLogoSrc] = useState('/logo-cadfuncional-aman.png');

	useEffect(() => {
		if (isReady && isAuthenticated) {
			navigate('/dashboard', { replace: true });
		}
	}, [isReady, isAuthenticated, navigate]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const success = await login({ username, password });
		if (success) {
			sessionStorage.setItem('show_sred_popup', '1');
			navigate('/dashboard', { replace: true });
		}
	};

	if (!isReady) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="100vh">
				<CircularProgress />
			</Stack>
		);
	}

	return (
		<Stack
			alignItems="center"
			justifyContent="center"
			minHeight="100vh"
			px={2}
			py={{ xs: 3, sm: 4 }}
			spacing={2.25}
			sx={{
				bgcolor: 'background.default',
				background: (theme) =>
					`linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${theme.palette.background.default} 35%)`,
			}}
		>
			<Stack width="100%" maxWidth={520} direction="row" justifyContent="flex-end">
				<Button
					variant="text"
					onClick={toggleMode}
					startIcon={mode === 'light' ? <DarkModeOutlinedIcon /> : <WbSunnyOutlinedIcon />}
					sx={{ minHeight: 44, minWidth: 44 }}
				>
					{mode === 'light' ? 'Modo escuro' : 'Modo claro'}
				</Button>
			</Stack>

			<Stack alignItems="center" spacing={0.35}>
				<Box
					component="img"
					src={logoSrc}
					alt="Brasão AMAN"
					onError={() => {
						if (logoSrc !== '/aman-logo.png') {
							setLogoSrc('/aman-logo.png');
						}
					}}
					sx={{
						width: { xs: 80, sm: 92 },
						height: { xs: 80, sm: 92 },
						objectFit: 'contain',
					}}
				/>
				<Typography
					variant="h4"
					fontWeight={700}
					lineHeight={1.04}
					sx={{ fontSize: { xs: '2rem', sm: '2.25rem' }, mt: 0.25 }}
				>
					Cadete Funcional
				</Typography>
				<Typography
					variant="subtitle1"
					fontWeight={700}
					letterSpacing={1.4}
					sx={{
						fontSize: { xs: '1.05rem', sm: '1.08rem' },
						color: mode === 'dark' ? 'common.white' : 'primary.main',
					}}
				>
					AMAN
				</Typography>
			</Stack>

			<SectionCard
				sx={{
					width: '100%',
					maxWidth: 520,
					borderRadius: 3,
					border: 1,
					borderColor: 'divider',
					bgcolor: (theme) => alpha(theme.palette.background.paper, 0.92),
				}}
				contentSx={{
					display: 'flex',
					flexDirection: 'column',
					gap: 1.8,
					p: { xs: 2.6, sm: 3.5 },
				}}
			>
				<Stack spacing={0.4}>
					<Typography
						variant="h4"
						fontWeight={700}
						sx={{ fontSize: { xs: '1.85rem', sm: '2.05rem' }, lineHeight: 1.18 }}
					>
						Bem-vindo de volta
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '1.03rem', sm: '1.08rem' } }}>
						Acesse o sistema com suas credenciais.
					</Typography>
				</Stack>

				<Stack component="form" spacing={1.35} onSubmit={handleSubmit}>
					<Stack spacing={0.65}>
						<Typography variant="subtitle1" fontWeight={600}>
							CPF*
						</Typography>
						<TextField
							name="username"
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							required
							fullWidth
							placeholder="Somente números"
							autoComplete="username"
							inputProps={{ 'aria-label': 'CPF' }}
							sx={{ '& .MuiInputBase-root': { minHeight: 50 } }}
						/>
					</Stack>

					<Stack spacing={0.65}>
						<Typography variant="subtitle1" fontWeight={600}>
							Senha*
						</Typography>
						<TextField
							name="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							required
							fullWidth
							placeholder="••••••••"
							autoComplete="current-password"
							inputProps={{ 'aria-label': 'Senha' }}
							sx={{ '& .MuiInputBase-root': { minHeight: 50 } }}
						/>
					</Stack>

					<Box
						sx={{
							borderRadius: 2,
							border: 1,
							borderColor: 'warning.main',
							bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
							px: 2,
							py: 1.1,
						}}
					>
						<Typography color="warning.main" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.02rem' } }}>
							Cadastro apenas por administrador.
						</Typography>
					</Box>

					<Stack
						direction={{ xs: 'column', sm: 'row' }}
						alignItems={{ xs: 'flex-start', sm: 'center' }}
						justifyContent="space-between"
						spacing={{ xs: 0.25, sm: 1.5 }}
					>
						<FormControlLabel
							control={<Checkbox size="small" />}
							label="Manter conectado"
							sx={{ mr: 0, '& .MuiFormControlLabel-label': { fontSize: '1rem' } }}
						/>
						<Button
							variant="text"
							size="small"
							type="button"
							sx={{ minHeight: 44, minWidth: 44, px: 0.5, ml: { xs: 0.5, sm: 0 } }}
						>
							Esqueceu a senha?
						</Button>
					</Stack>

					{loginError ? <Alert severity="error">{loginError}</Alert> : null}

					<Button
						type="submit"
						variant="contained"
						disabled={isAuthenticating}
						startIcon={<LoginOutlinedIcon />}
						sx={{ minHeight: 50, minWidth: 44, borderRadius: 2 }}
					>
						{isAuthenticating ? 'Entrando...' : 'Entrar no Sistema'}
					</Button>
				</Stack>
			</SectionCard>

			<Typography variant="caption" color="text.secondary" sx={{ opacity: 0.8 }}>
				© 2026 Academia Militar das Agulhas Negras
			</Typography>
		</Stack>
	);
};

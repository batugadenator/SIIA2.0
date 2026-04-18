import { Alert, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { SectionCard } from '../design-system';
import { canAccessRoute } from '../app/accessControl';
import { useAuth } from '../providers/AuthProvider';

interface ConfigItem {
	label: string;
	path: string;
}

const CADFUNCIONAL_BASE = '/dashboard/cadfuncional';

const configItems: ConfigItem[] = [
	{ label: 'Usuários e Perfis', path: `${CADFUNCIONAL_BASE}/usuarios-perfis` },
	{ label: 'Configuração LDAP', path: `${CADFUNCIONAL_BASE}/configuracao-ldap` },
	{ label: 'Importar CSV', path: `${CADFUNCIONAL_BASE}/importar-csv` },
	{ label: 'Carga de Referências', path: `${CADFUNCIONAL_BASE}/carga-referencias` },
	{ label: 'Cadastrar Discentes', path: `${CADFUNCIONAL_BASE}/cadetes/novo` },
];

export const ConfigGeralPage = () => {
	const { user } = useAuth();

	return (
		<Stack spacing={2}>
			<Typography variant="h5" fontWeight={700}>
				Configurações Gerais
			</Typography>
			<Typography variant="body2" color="text.secondary">
				Centralize aqui os atalhos de administração e carga operacional do sistema.
			</Typography>

			<SectionCard title="Acessos e Configurações">
				<Stack spacing={1.25}>
					{configItems.map((item) => {
						const canOpen = canAccessRoute(user?.perfil, item.path.replace('/dashboard/cadfuncional', ''));
						return (
							<Button
								key={item.path}
								variant="outlined"
								component={RouterLink}
								to={item.path}
								disabled={!canOpen}
								sx={{ minHeight: 44, justifyContent: 'flex-start' }}
							>
								{item.label}
							</Button>
						);
					})}
				</Stack>
			</SectionCard>

			<Alert severity="info">
				Alguns atalhos podem ficar desabilitados conforme o perfil autenticado.
			</Alert>
		</Stack>
	);
};

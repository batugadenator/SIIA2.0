import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	Divider,
	FormControlLabel,
	InputAdornment,
	Stack,
	Switch,
	TextField,
	Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { EmptyState, SectionCard } from '../design-system';
import { useLdapConfigStatus, useUpdateLdapConfig } from '../hooks/useAuthUsuarios';
import { useAuth } from '../providers/AuthProvider';
import type { LdapConfigUpdate } from '../types/auth';

type FormState = {
	enabled: boolean;
	server_uri: string;
	bind_dn: string;
	bind_password: string;
	user_search_base_dn: string;
	user_search_filter: string;
	start_tls: boolean;
	always_update_user: boolean;
	mirror_groups: boolean;
	cache_timeout: string;
	attr_first_name: string;
	attr_last_name: string;
	attr_email: string;
	group_search_base_dn: string;
	group_search_filter: string;
	group_type: string;
	posix_member_attr: string;
	admin_group_dn: string;
};

const EMPTY_FORM: FormState = {
	enabled: false,
	server_uri: '',
	bind_dn: '',
	bind_password: '',
	user_search_base_dn: '',
	user_search_filter: '(uid=%(user)s)',
	start_tls: false,
	always_update_user: true,
	mirror_groups: false,
	cache_timeout: '3600',
	attr_first_name: 'givenName',
	attr_last_name: 'sn',
	attr_email: 'mail',
	group_search_base_dn: '',
	group_search_filter: '(objectClass=groupOfNames)',
	group_type: 'groupofnames',
	posix_member_attr: 'memberUid',
	admin_group_dn: '',
};

export const ConfiguracaoLdapPage = () => {
	const { user } = useAuth();
	const { data, isLoading, isError, refetch } = useLdapConfigStatus();
	const { mutate: saveConfig, isPending: isSaving, isSuccess: savedOk, error: saveError } = useUpdateLdapConfig();
	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [successMsg, setSuccessMsg] = useState('');

	useEffect(() => {
		if (data) {
			setForm({
				enabled: data.enabled,
				server_uri: data.server_uri,
				bind_dn: data.bind_dn,
				bind_password: '',
				user_search_base_dn: data.user_search_base_dn,
				user_search_filter: data.user_search_filter,
				start_tls: data.start_tls,
				always_update_user: data.always_update_user,
				mirror_groups: data.mirror_groups,
				cache_timeout: String(data.cache_timeout),
				attr_first_name: data.attr_first_name,
				attr_last_name: data.attr_last_name,
				attr_email: data.attr_email,
				group_search_base_dn: data.group_search_base_dn,
				group_search_filter: data.group_search_filter,
				group_type: data.group_type,
				posix_member_attr: data.posix_member_attr,
				admin_group_dn: data.admin_group_dn,
			});
		}
	}, [data]);

	useEffect(() => {
		if (savedOk) {
			setSuccessMsg('Configurações LDAP salvas e aplicadas com sucesso.');
			const t = setTimeout(() => setSuccessMsg(''), 5000);
			return () => clearTimeout(t);
		}
	}, [savedOk]);

	if (!user?.is_staff) {
		return (
			<EmptyState
				title="Acesso Restrito"
				description="Apenas administradores podem acessar esta página."
				height="45vh"
			/>
		);
	}

	if (isLoading) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="45vh">
				<CircularProgress />
			</Stack>
		);
	}

	if (isError || !data) {
		return (
			<SectionCard title="Configuração LDAP">
				<EmptyState
					title="Erro ao carregar configuração LDAP"
					description="Não foi possível consultar o status LDAP no backend."
					action={<Button onClick={() => void refetch()}>Tentar novamente</Button>}
				/>
			</SectionCard>
		);
	}

	const txt = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
		setForm((prev) => ({ ...prev, [field]: e.target.value }));

	const toggle = (field: keyof FormState) => (_: React.SyntheticEvent, checked: boolean) =>
		setForm((prev) => ({ ...prev, [field]: checked }));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const payload: LdapConfigUpdate = {
			enabled: form.enabled,
			server_uri: form.server_uri.trim(),
			bind_dn: form.bind_dn.trim(),
			user_search_base_dn: form.user_search_base_dn.trim(),
			user_search_filter: form.user_search_filter.trim(),
			start_tls: form.start_tls,
			always_update_user: form.always_update_user,
			mirror_groups: form.mirror_groups,
			cache_timeout: parseInt(form.cache_timeout, 10) || 0,
			attr_first_name: form.attr_first_name.trim(),
			attr_last_name: form.attr_last_name.trim(),
			attr_email: form.attr_email.trim(),
			group_search_base_dn: form.group_search_base_dn.trim(),
			group_search_filter: form.group_search_filter.trim(),
			group_type: form.group_type.trim(),
			posix_member_attr: form.posix_member_attr.trim(),
			admin_group_dn: form.admin_group_dn.trim(),
		};
		// Only send bind_password if admin explicitly typed a new one.
		if (form.bind_password) {
			payload.bind_password = form.bind_password;
		}
		saveConfig(payload);
	};

	return (
		<Stack spacing={3} p={2} component="form" onSubmit={handleSubmit}>
			{/* Header */}
			<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
				<Stack spacing={0.5}>
					<Typography variant="h5" fontWeight={600}>
						Configuração LDAP
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Gerencie a autenticação LDAP diretamente pela interface.
						{data.updated_by_username && (
							<> Última alteração por <strong>{data.updated_by_username}</strong>.</>
						)}
					</Typography>
				</Stack>
				<Stack direction="row" spacing={1.5} alignItems="center">
					<Chip
						icon={<HubOutlinedIcon />}
						label={data.enabled ? 'LDAP Ativo' : 'LDAP Inativo'}
						color={data.enabled ? 'success' : 'default'}
						variant={data.enabled ? 'filled' : 'outlined'}
					/>
					<Button
						type="submit"
						variant="contained"
						startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
						disabled={isSaving}
						sx={{ minHeight: 44 }}
					>
						{isSaving ? 'Salvando…' : 'Salvar'}
					</Button>
				</Stack>
			</Stack>

			{successMsg && <Alert severity="success" variant="outlined">{successMsg}</Alert>}
			{saveError ? (
				<Alert severity="error" variant="outlined">
					Erro ao salvar: {saveError instanceof Error ? saveError.message : 'Falha na requisição.'}
				</Alert>
			) : null}

			{/* Enable toggle */}
			<SectionCard title="Ativar LDAP">
				<FormControlLabel
					control={<Switch checked={form.enabled} onChange={toggle('enabled')} />}
					label={form.enabled ? 'LDAP habilitado' : 'LDAP desabilitado'}
				/>
			</SectionCard>

			{/* Connection */}
			<SectionCard title="Conexão e Bind">
				<Stack spacing={2}>
					<TextField
						label="Servidor LDAP (URI)"
						value={form.server_uri}
						onChange={txt('server_uri')}
						placeholder="ldap://seu-servidor:389"
						fullWidth
						inputProps={{ minLength: 0, maxLength: 255 }}
					/>
					<TextField
						label="Bind DN"
						value={form.bind_dn}
						onChange={txt('bind_dn')}
						placeholder="cn=admin,dc=example,dc=com"
						fullWidth
						inputProps={{ maxLength: 255 }}
					/>
					<TextField
						label="Senha de Bind"
						value={form.bind_password}
						onChange={txt('bind_password')}
						type="password"
						fullWidth
						placeholder={data.bind_password_configured ? '(manter senha atual)' : 'Nova senha'}
						helperText={data.bind_password_configured ? 'Senha já configurada. Preencha apenas para alterar.' : 'Nenhuma senha configurada.'}
						inputProps={{ maxLength: 255 }}
						InputProps={{
							endAdornment: data.bind_password_configured ? (
								<InputAdornment position="end">
									<Chip label="Configurada" size="small" color="success" variant="outlined" />
								</InputAdornment>
							) : undefined,
						}}
					/>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<FormControlLabel
							control={<Switch checked={form.start_tls} onChange={toggle('start_tls')} />}
							label="Start TLS"
						/>
						<TextField
							label="Cache (segundos)"
							value={form.cache_timeout}
							onChange={txt('cache_timeout')}
							type="number"
							inputProps={{ min: 0, max: 86400 }}
							sx={{ maxWidth: 180 }}
						/>
					</Stack>
				</Stack>
			</SectionCard>

			<Divider />

			{/* User search */}
			<SectionCard title="Busca de Usuários">
				<Stack spacing={2}>
					<TextField
						label="Base DN de usuários"
						value={form.user_search_base_dn}
						onChange={txt('user_search_base_dn')}
						placeholder="ou=users,dc=example,dc=com"
						fullWidth
						inputProps={{ maxLength: 255 }}
					/>
					<TextField
						label="Filtro de usuários"
						value={form.user_search_filter}
						onChange={txt('user_search_filter')}
						fullWidth
						inputProps={{ maxLength: 255 }}
					/>
					<FormControlLabel
						control={<Switch checked={form.always_update_user} onChange={toggle('always_update_user')} />}
						label="Atualizar usuário a cada login"
					/>
				</Stack>
			</SectionCard>

			<Divider />

			{/* Attribute mapping */}
			<SectionCard title="Mapeamento de Atributos">
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<TextField label="Primeiro nome" value={form.attr_first_name} onChange={txt('attr_first_name')} fullWidth inputProps={{ maxLength: 80 }} />
					<TextField label="Sobrenome" value={form.attr_last_name} onChange={txt('attr_last_name')} fullWidth inputProps={{ maxLength: 80 }} />
					<TextField label="E-mail" value={form.attr_email} onChange={txt('attr_email')} fullWidth inputProps={{ maxLength: 80 }} />
				</Stack>
			</SectionCard>

			<Divider />

			{/* Groups */}
			<SectionCard title="Grupos e Administração">
				<Stack spacing={2}>
					<TextField
						label="Base DN de grupos"
						value={form.group_search_base_dn}
						onChange={txt('group_search_base_dn')}
						placeholder="ou=groups,dc=example,dc=com"
						fullWidth
						inputProps={{ maxLength: 255 }}
					/>
					<TextField
						label="Filtro de grupos"
						value={form.group_search_filter}
						onChange={txt('group_search_filter')}
						fullWidth
						inputProps={{ maxLength: 255 }}
					/>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							label="Tipo de grupo"
							value={form.group_type}
							onChange={txt('group_type')}
							placeholder="groupofnames | posixgroup"
							fullWidth
							inputProps={{ maxLength: 30 }}
						/>
						<TextField
							label="Atributo POSIX (memberUid)"
							value={form.posix_member_attr}
							onChange={txt('posix_member_attr')}
							fullWidth
							inputProps={{ maxLength: 80 }}
						/>
					</Stack>
					<FormControlLabel
						control={<Switch checked={form.mirror_groups} onChange={toggle('mirror_groups')} />}
						label="Espelhar grupos LDAP nos grupos Django"
					/>
					<TextField
						label="DN do grupo Administrador"
						value={form.admin_group_dn}
						onChange={txt('admin_group_dn')}
						placeholder="cn=admins,ou=groups,dc=example,dc=com"
						fullWidth
						inputProps={{ maxLength: 255 }}
						helperText="Usuários neste grupo receberão is_staff=true automaticamente."
					/>
				</Stack>
			</SectionCard>

			{/* Bottom save button for mobile convenience */}
			<Stack direction="row" justifyContent="flex-end" pb={2}>
				<Button
					type="submit"
					variant="contained"
					startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
					disabled={isSaving}
					sx={{ minHeight: 44, minWidth: 140 }}
				>
					{isSaving ? 'Salvando…' : 'Salvar configurações'}
				</Button>
			</Stack>
		</Stack>
	);
};

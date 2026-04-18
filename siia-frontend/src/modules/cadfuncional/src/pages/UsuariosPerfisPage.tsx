import { useState, type FormEvent } from 'react';

import {
	Alert,
	Button,
	Checkbox,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	MenuItem,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
} from '@mui/material';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';

import { EmptyState, SectionCard, useNotify } from '../design-system';
import {
	useAdminResetSystemUserPassword,
	useCreateSystemUser,
	useDeleteSystemUser,
	useListSystemUsers,
	useUpdateSystemUser,
} from '../hooks/useAuthUsuarios';
import { useAuth } from '../providers/AuthProvider';
import type { CreateSystemUserPayload, EspecialidadeMedica, FuncaoInstrutor, SystemUserDetail, SystemUserProfile, UpdateUserPayload } from '../types/auth';

const perfisAcesso: SystemUserProfile[] = [
	'Administrador',
	'Consultor',
	'Profissional de Educação Física',
	'Enfermeiro',
	'Fisioterapeuta',
	'Instrutor',
	'Médico',
	'Nutricionista',
	'Psicopedagogo',
];

const especialidadesMedicas: EspecialidadeMedica[] = ['Ortopedista', 'Clínico Geral'];

const funcoesInstrutor: FuncaoInstrutor[] = [
	'Comandante do Corpo de Cadetes',
	'Subcomandante do Corpo de Cadetes',
	'S1-CC',
	'Comandante de Curso',
	'Comandante de Subunidade',
	'Comandante de Pelotão',
];

interface FormState {
	nome_completo: string;
	cpf: string;
	perfil: '' | SystemUserProfile;
	especialidade_medica: '' | EspecialidadeMedica;
	funcao_instrutor: '' | FuncaoInstrutor;
	posto_graduacao: string;
	nome_guerra: string;
	setor: string;
	fracao: string;
	senha_inicial: string;
	confirmar_senha_inicial: string;
	usuario_ativo: boolean;
}

const initialFormState: FormState = {
	nome_completo: '',
	cpf: '',
	perfil: '',
	especialidade_medica: '',
	funcao_instrutor: '',
	posto_graduacao: '',
	nome_guerra: '',
	setor: '',
	fracao: '',
	senha_inicial: '',
	confirmar_senha_inicial: '',
	usuario_ativo: true,
};

interface EditDialogState {
	open: boolean;
	userId: number | null;
	cpf: string;
	perfil: '' | SystemUserProfile;
	especialidade_medica: '' | EspecialidadeMedica;
	funcao_instrutor: '' | FuncaoInstrutor;
	posto_graduacao: string;
	nome_guerra: string;
	setor: string;
	fracao: string;
	usuario_ativo: boolean;
	isLoading: boolean;
	error: string | null;
}

const initialEditDialogState: EditDialogState = {
	open: false,
	userId: null,
	cpf: '',
	perfil: '',
	especialidade_medica: '',
	funcao_instrutor: '',
	posto_graduacao: '',
	nome_guerra: '',
	setor: '',
	fracao: '',
	usuario_ativo: false,
	isLoading: false,
	error: null,
};

const normalizeCpf = (value: string): string => value.replace(/\D/g, '').slice(0, 11);

const getErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		const detail = error.response?.data?.detail;
		if (typeof detail === 'string' && detail.trim()) {
			return detail;
		}

		const payload = error.response?.data as Record<string, unknown> | undefined;
		if (payload) {
			const firstKey = Object.keys(payload)[0];
			if (firstKey) {
				const value = payload[firstKey];
				if (Array.isArray(value) && typeof value[0] === 'string') {
					return value[0];
				}
				if (typeof value === 'string') {
					return value;
				}
			}
		}
	}

	return 'Ocorreu um erro. Tente novamente.';
};

export const UsuariosPerfisPage = () => {
	const notify = useNotify();
	const { user } = useAuth();

	// Se não for admin, redirecionar automaticamente não é necessário aqui,
	// mas vamos mostrar uma página vazia/protegida
	if (!user?.is_staff) {
		return (
			<EmptyState
				title="Acesso Restrito"
				description="Apenas administradores podem acessar esta página."
				height="45vh"
			/>
		);
	}

	const { data: usuarios, isLoading, isError, refetch } = useListSystemUsers();
	const createUserMutation = useCreateSystemUser();
	const updateUserMutation = useUpdateSystemUser();
	const deleteUserMutation = useDeleteSystemUser();
	const adminResetPasswordMutation = useAdminResetSystemUserPassword();

	const [formData, setFormData] = useState<FormState>(initialFormState);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [editDialog, setEditDialog] = useState<EditDialogState>(initialEditDialogState);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitError(null);

		if (!formData.perfil) {
			const message = 'Selecione um perfil de acesso.';
			setSubmitError(message);
			notify(message, 'error');
			return;
		}

		const cpfNormalizado = normalizeCpf(formData.cpf);
		if (cpfNormalizado.length !== 11) {
			const message = 'Informe um CPF válido com 11 dígitos.';
			setSubmitError(message);
			notify(message, 'error');
			return;
		}

		if (formData.perfil === 'Médico' && !formData.especialidade_medica) {
			const message = 'Selecione a especialidade médica.';
			setSubmitError(message);
			notify(message, 'error');
			return;
		}

		if (formData.perfil === 'Instrutor' && !formData.funcao_instrutor) {
			const message = 'Selecione a função do instrutor.';
			setSubmitError(message);
			notify(message, 'error');
			return;
		}

		if (formData.senha_inicial !== formData.confirmar_senha_inicial) {
			const message = 'As senhas não conferem.';
			setSubmitError(message);
			notify(message, 'error');
			return;
		}

		const payload: CreateSystemUserPayload = {
			nome_completo: formData.nome_completo.trim(),
			cpf: cpfNormalizado,
			perfil: formData.perfil,
			especialidade_medica: formData.perfil === 'Médico' ? formData.especialidade_medica : '',
			funcao_instrutor: formData.perfil === 'Instrutor' ? formData.funcao_instrutor : '',
			posto_graduacao: formData.posto_graduacao.trim(),
			nome_guerra: formData.nome_guerra.trim(),
			setor: formData.setor.trim(),
			fracao: formData.fracao.trim(),
			senha_inicial: formData.senha_inicial,
			confirmar_senha_inicial: formData.confirmar_senha_inicial,
			usuario_ativo: formData.usuario_ativo,
		};

		try {
			await createUserMutation.mutateAsync(payload);
			notify('Usuário criado com sucesso.', 'success');
			setFormData(initialFormState);
			void refetch();
		} catch (error) {
			const message = getErrorMessage(error);
			setSubmitError(message);
			notify(message, 'error');
		}
	};

	const handleEditOpen = (usuario: SystemUserDetail) => {
		setEditDialog({
			open: true,
			userId: usuario.id,
			cpf: usuario.cpf,
			perfil: usuario.perfil,
			especialidade_medica: (usuario.especialidade_medica || '') as EditDialogState['especialidade_medica'],
			funcao_instrutor: (usuario.funcao_instrutor || '') as EditDialogState['funcao_instrutor'],
			posto_graduacao: usuario.posto_graduacao || '',
			nome_guerra: usuario.nome_guerra || '',
			setor: usuario.setor || '',
			fracao: usuario.fracao || '',
			usuario_ativo: usuario.is_active,
			isLoading: false,
			error: null,
		});
	};

	const handleEditClose = () => {
		setEditDialog(initialEditDialogState);
	};

	const handleEditSave = async () => {
		if (!editDialog.userId) return;

		const cpfNormalizado = normalizeCpf(editDialog.cpf);
		if (cpfNormalizado.length !== 11) {
			const message = 'Informe um CPF válido com 11 dígitos.';
			setEditDialog((current) => ({ ...current, error: message }));
			notify(message, 'error');
			return;
		}

		setEditDialog((current) => ({ ...current, isLoading: true, error: null }));

		const payload: UpdateUserPayload = {
			cpf: cpfNormalizado,
			perfil: editDialog.perfil || undefined,
			especialidade_medica: editDialog.perfil === 'Médico' ? editDialog.especialidade_medica : '',
			funcao_instrutor: editDialog.perfil === 'Instrutor' ? editDialog.funcao_instrutor : '',
			posto_graduacao: editDialog.posto_graduacao.trim(),
			nome_guerra: editDialog.nome_guerra.trim(),
			setor: editDialog.setor.trim(),
			fracao: editDialog.fracao.trim(),
			usuario_ativo: editDialog.usuario_ativo,
		};

		try {
			await updateUserMutation.mutateAsync({ userId: editDialog.userId, payload });
			notify('Usuário atualizado com sucesso.', 'success');
			handleEditClose();
			void refetch();
		} catch (error) {
			const message = getErrorMessage(error);
			setEditDialog((current) => ({ ...current, error: message, isLoading: false }));
			notify(message, 'error');
		}
	};

	const handleResetUserPassword = async () => {
		if (!editDialog.userId) return;

		setEditDialog((current) => ({ ...current, isLoading: true, error: null }));
		try {
			const result = await adminResetPasswordMutation.mutateAsync(editDialog.userId);
			notify(result.detail, 'success');
			setEditDialog((current) => ({ ...current, isLoading: false }));
		} catch (error) {
			const message = getErrorMessage(error);
			setEditDialog((current) => ({ ...current, error: message, isLoading: false }));
			notify(message, 'error');
		}
	};

	const handleDeleteUser = async () => {
		if (!editDialog.userId) return;

		setEditDialog((current) => ({ ...current, isLoading: true, error: null }));
		try {
			await deleteUserMutation.mutateAsync(editDialog.userId);
			notify('Usuário removido com sucesso.', 'success');
			handleEditClose();
			void refetch();
		} catch (error) {
			const message = getErrorMessage(error);
			setEditDialog((current) => ({ ...current, error: message, isLoading: false }));
			notify(message, 'error');
		}
	};

	if (isLoading) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="45vh">
				<CircularProgress />
			</Stack>
		);
	}

	if (isError) {
		return (
			<EmptyState
				title="Falha ao carregar usuários"
				description="Verifique a conexão e tente novamente."
				action={
					<Button
						variant="contained"
						onClick={() => void refetch()}
						sx={{ minHeight: 44, minWidth: 44 }}
					>
						Recarregar
					</Button>
				}
				height="45vh"
			/>
		);
	}

	return (
		<Stack spacing={2}>
			<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
				<Stack spacing={0.5}>
					<Typography variant="h5">Usuários e Perfis</Typography>
					<Typography variant="body2" color="text.secondary">
						Gerencie acesso, perfil e senha dos usuários
					</Typography>
				</Stack>
				<Button
					component={RouterLink}
					to="/dashboard/cadfuncional/configuracoes-gerais"
					variant="text"
					sx={{ minHeight: 44, minWidth: 44, alignSelf: { xs: 'flex-start', sm: 'center' } }}
				>
					&lt; Voltar para Configurações
				</Button>
			</Stack>

			{/* Listagem de usuários cadastrados */}
			<SectionCard title="Usuários Cadastrados" subtitle="Todos os usuários de sistema.">
				<TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
					<Table size="small" sx={{ minWidth: 960 }}>
						<TableHead>
							<TableRow>
								<TableCell>Nome</TableCell>
								<TableCell>CPF</TableCell>
								<TableCell>Perfil</TableCell>
								<TableCell>Espec./Função</TableCell>
								<TableCell>Posto/Grad</TableCell>
								<TableCell>Nome de Guerra</TableCell>
								<TableCell>Setor</TableCell>
								<TableCell>Fração</TableCell>
								<TableCell>Ativo</TableCell>
								<TableCell align="right">Ações</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{usuarios && usuarios.length > 0 ? (
								usuarios.map((usuario) => (
									<TableRow key={usuario.id}>
										<TableCell>
											{[usuario.first_name, usuario.last_name]
												.filter(Boolean)
												.join(' ') || usuario.username}
										</TableCell>
										<TableCell>{usuario.cpf}</TableCell>
										<TableCell>{usuario.perfil}</TableCell>
										<TableCell>
											{usuario.especialidade_medica || usuario.funcao_instrutor || '—'}
										</TableCell>
										<TableCell>{usuario.posto_graduacao || '—'}</TableCell>
										<TableCell>{usuario.nome_guerra || '—'}</TableCell>
										<TableCell>{usuario.setor || '—'}</TableCell>
										<TableCell>{usuario.fracao || '—'}</TableCell>
										<TableCell>{usuario.is_active ? 'Sim' : 'Não'}</TableCell>
										<TableCell align="right">
											<Button
												size="small"
												variant="outlined"
												onClick={() => handleEditOpen(usuario)}
												sx={{ minHeight: 36, minWidth: 36 }}
											>
												Editar
											</Button>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={10} align="center">
										Nenhum usuário cadastrado
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			</SectionCard>

			{/* Formulário de novo usuário */}
			<SectionCard title="Novo Usuário" subtitle="Crie um usuário e atribua o perfil de acesso.">
				<Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
					<TextField
						label="Nome completo"
						value={formData.nome_completo}
						onChange={(event) =>
							setFormData((current) => ({ ...current, nome_completo: event.target.value }))
						}
						required
						fullWidth
						sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
					/>

					<TextField
						label="CPF"
						value={formData.cpf}
						onChange={(event) =>
							setFormData((current) => ({ ...current, cpf: normalizeCpf(event.target.value) }))
						}
						required
						fullWidth
						helperText="Use apenas números."
						sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
					/>

					<TextField
						select
						label="Perfil"
						value={formData.perfil}
						onChange={(event) =>
							setFormData((current) => ({
								...current,
								perfil: event.target.value as FormState['perfil'],
								especialidade_medica: event.target.value !== 'Médico' ? '' : current.especialidade_medica,
								funcao_instrutor: event.target.value !== 'Instrutor' ? '' : current.funcao_instrutor,
							}))
						}
						required
						fullWidth
						sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
					>
						<MenuItem value="">Selecione</MenuItem>
						{perfisAcesso.map((perfil) => (
							<MenuItem key={perfil} value={perfil}>
								{perfil}
							</MenuItem>
						))}
					</TextField>

					{formData.perfil === 'Médico' ? (
						<TextField
							select
							label="Especialidade Médica"
							value={formData.especialidade_medica}
							onChange={(event) =>
								setFormData((current) => ({
									...current,
									especialidade_medica: event.target.value as FormState['especialidade_medica'],
								}))
							}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Selecione</MenuItem>
							{especialidadesMedicas.map((esp) => (
								<MenuItem key={esp} value={esp}>
									{esp}
								</MenuItem>
							))}
						</TextField>
					) : null}

					{formData.perfil === 'Instrutor' ? (
						<TextField
							select
							label="Função"
							value={formData.funcao_instrutor}
							onChange={(event) =>
								setFormData((current) => ({
									...current,
									funcao_instrutor: event.target.value as FormState['funcao_instrutor'],
								}))
							}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Selecione</MenuItem>
							{funcoesInstrutor.map((fn) => (
								<MenuItem key={fn} value={fn}>
									{fn}
								</MenuItem>
							))}
						</TextField>
					) : null}

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Posto/Grad"
							value={formData.posto_graduacao}
							onChange={(event) =>
								setFormData((current) => ({ ...current, posto_graduacao: event.target.value }))
							}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							label="Nome de Guerra"
							value={formData.nome_guerra}
							onChange={(event) =>
								setFormData((current) => ({ ...current, nome_guerra: event.target.value }))
							}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Setor"
							value={formData.setor}
							onChange={(event) =>
								setFormData((current) => ({ ...current, setor: event.target.value }))
							}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							label="Fração"
							value={formData.fracao}
							onChange={(event) =>
								setFormData((current) => ({ ...current, fracao: event.target.value }))
							}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Senha inicial"
							type="password"
							value={formData.senha_inicial}
							onChange={(event) =>
								setFormData((current) => ({ ...current, senha_inicial: event.target.value }))
							}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							label="Confirmar senha inicial"
							type="password"
							value={formData.confirmar_senha_inicial}
							onChange={(event) =>
								setFormData((current) => ({
									...current,
									confirmar_senha_inicial: event.target.value,
								}))
							}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<FormControlLabel
						control={
							<Checkbox
								checked={formData.usuario_ativo}
								onChange={(event) =>
									setFormData((current) => ({ ...current, usuario_ativo: event.target.checked }))
								}
							/>
						}
						label="Usuário ativo"
					/>

					{submitError ? <Alert severity="error">{submitError}</Alert> : null}

					<Button
						type="submit"
						variant="contained"
						disabled={createUserMutation.isPending}
						sx={{ minHeight: 44, minWidth: 44, alignSelf: 'flex-start' }}
					>
						{createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
					</Button>
				</Stack>
			</SectionCard>

			{/* Dialog de edição */}
			<Dialog open={editDialog.open} onClose={handleEditClose} maxWidth="sm" fullWidth>
				<DialogTitle>Editar Usuário</DialogTitle>
				<DialogContent sx={{ pt: 2 }}>
					<Stack spacing={1.5}>
						<TextField
							label="CPF"
							value={editDialog.cpf}
							onChange={(event) =>
								setEditDialog((current) => ({ ...current, cpf: normalizeCpf(event.target.value) }))
							}
							required
							fullWidth
							helperText="Use apenas números."
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							select
							label="Perfil"
							value={editDialog.perfil}
							onChange={(event) =>
								setEditDialog((current) => ({
									...current,
									perfil: event.target.value as EditDialogState['perfil'],
									especialidade_medica:
										event.target.value !== 'Médico' ? '' : current.especialidade_medica,
									funcao_instrutor:
										event.target.value !== 'Instrutor' ? '' : current.funcao_instrutor,
								}))
							}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Selecione</MenuItem>
							{perfisAcesso.map((perfil) => (
								<MenuItem key={perfil} value={perfil}>
									{perfil}
								</MenuItem>
							))}
						</TextField>

						{editDialog.perfil === 'Médico' ? (
							<TextField
								select
								label="Especialidade Médica"
								value={editDialog.especialidade_medica}
								onChange={(event) =>
									setEditDialog((current) => ({
										...current,
										especialidade_medica: event.target.value as EditDialogState['especialidade_medica'],
									}))
								}
								required
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								<MenuItem value="">Selecione</MenuItem>
								{especialidadesMedicas.map((esp) => (
									<MenuItem key={esp} value={esp}>
										{esp}
									</MenuItem>
								))}
							</TextField>
						) : null}

						{editDialog.perfil === 'Instrutor' ? (
							<TextField
								select
								label="Função"
								value={editDialog.funcao_instrutor}
								onChange={(event) =>
									setEditDialog((current) => ({
										...current,
										funcao_instrutor: event.target.value as EditDialogState['funcao_instrutor'],
									}))
								}
								required
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								<MenuItem value="">Selecione</MenuItem>
								{funcoesInstrutor.map((fn) => (
									<MenuItem key={fn} value={fn}>
										{fn}
									</MenuItem>
								))}
							</TextField>
						) : null}

						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								label="Posto/Grad"
								value={editDialog.posto_graduacao}
								onChange={(event) =>
									setEditDialog((current) => ({ ...current, posto_graduacao: event.target.value }))
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							/>
							<TextField
								label="Nome de Guerra"
								value={editDialog.nome_guerra}
								onChange={(event) =>
									setEditDialog((current) => ({ ...current, nome_guerra: event.target.value }))
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							/>
						</Stack>

						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								label="Setor"
								value={editDialog.setor}
								onChange={(event) =>
									setEditDialog((current) => ({ ...current, setor: event.target.value }))
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							/>
							<TextField
								label="Fração"
								value={editDialog.fracao}
								onChange={(event) =>
									setEditDialog((current) => ({ ...current, fracao: event.target.value }))
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							/>
						</Stack>

						<FormControlLabel
							control={
								<Checkbox
									checked={editDialog.usuario_ativo}
									onChange={(event) =>
										setEditDialog((current) => ({
											...current,
											usuario_ativo: event.target.checked,
										}))
									}
								/>
							}
							label="Usuário ativo"
						/>

						{editDialog.error ? <Alert severity="error">{editDialog.error}</Alert> : null}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={handleEditClose}>Cancelar</Button>
					<Button onClick={() => void handleResetUserPassword()} disabled={editDialog.isLoading}>
						Resetar senha
					</Button>
					<Button color="error" onClick={() => void handleDeleteUser()} disabled={editDialog.isLoading}>
						Apagar usuário
					</Button>
					<Button
						onClick={() => void handleEditSave()}
						variant="contained"
						disabled={editDialog.isLoading}
					>
						{editDialog.isLoading ? 'Salvando...' : 'Salvar'}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
};

import { useState, type FormEvent } from 'react';

import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import axios from 'axios';

import { SectionCard, useNotify } from '../design-system';
import {
	useChangePassword,
	useRequestPasswordReset,
} from '../hooks/useAuthUsuarios';
import { useAuth } from '../providers/AuthProvider';

interface ChangePasswordFormState {
	senha_atual: string;
	senha_nova: string;
	confirmar_senha_nova: string;
}

interface PasswordResetFormState {
	cpf: string;
}

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

export const MinhaContaPage = () => {
	const notify = useNotify();
	const { user, logout } = useAuth();

	const [changePasswordOpen, setChangePasswordOpen] = useState(false);
	const [resetPasswordOpen, setResetPasswordOpen] = useState(false);

	const [changePasswordForm, setChangePasswordForm] = useState<ChangePasswordFormState>({
		senha_atual: '',
		senha_nova: '',
		confirmar_senha_nova: '',
	});
	const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

	const [resetPasswordForm, setResetPasswordForm] = useState<PasswordResetFormState>({
		cpf: user?.username ?? '',
	});
	const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);
	const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);

	const changePasswordMutation = useChangePassword();
	const resetPasswordMutation = useRequestPasswordReset();

	const handleChangePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setChangePasswordError(null);

		if (changePasswordForm.senha_nova !== changePasswordForm.confirmar_senha_nova) {
			const message = 'As senhas não conferem.';
			setChangePasswordError(message);
			notify(message, 'error');
			return;
		}

		if (changePasswordForm.senha_nova.length < 6) {
			const message = 'A nova senha deve ter pelo menos 6 caracteres.';
			setChangePasswordError(message);
			notify(message, 'error');
			return;
		}

		try {
			await changePasswordMutation.mutateAsync({
				senha_atual: changePasswordForm.senha_atual,
				senha_nova: changePasswordForm.senha_nova,
				confirmar_senha_nova: changePasswordForm.confirmar_senha_nova,
			});
			notify('Senha alterada com sucesso.', 'success');
			setChangePasswordForm({ senha_atual: '', senha_nova: '', confirmar_senha_nova: '' });
			setChangePasswordOpen(false);
		} catch (error) {
			const message = getErrorMessage(error);
			setChangePasswordError(message);
			notify(message, 'error');
		}
	};

	const handleResetPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setResetPasswordError(null);
		setResetPasswordSuccess(false);

		try {
			await resetPasswordMutation.mutateAsync({
				cpf: normalizeCpf(resetPasswordForm.cpf),
			});
			notify('Recuperação de senha solicitada com sucesso.', 'success');
			setResetPasswordSuccess(true);
			setResetPasswordForm({ cpf: '' });
			setTimeout(() => setResetPasswordOpen(false), 2000);
		} catch (error) {
			const message = getErrorMessage(error);
			setResetPasswordError(message);
			notify(message, 'error');
		}
	};

	return (
		<Stack spacing={2}>
			<Typography variant="h5">Minha Conta</Typography>

			{/* Dados da Sessão */}
			<SectionCard title="Dados da Sessão" subtitle="Informações do usuário autenticado no sistema.">
				<Stack spacing={1}>
					<Typography>
						<strong>Usuário:</strong> {user?.username ?? '-'}
					</Typography>
					<Typography>
						<strong>Nome:</strong> {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || '-'}
					</Typography>
					<Typography>
						<strong>Perfil administrativo:</strong> {user?.is_staff ? 'Sim' : 'Não'}
					</Typography>

					<Button
						variant="outlined"
						onClick={() => void logout()}
						sx={{ minHeight: 44, minWidth: 44, alignSelf: 'flex-start', mt: 1 }}
					>
						Encerrar sessão
					</Button>
				</Stack>
			</SectionCard>

			{/* Segurança - Mudar Senha */}
			<SectionCard title="Segurança" subtitle="Gerenciar senha e recuperação de conta.">
				<Stack spacing={1.5}>
					<Typography variant="body2" color="text.secondary">
						Altere sua senha regularmente para manter sua conta segura.
					</Typography>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<Button
							variant="outlined"
							onClick={() => setChangePasswordOpen(true)}
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							Mudar Senha
						</Button>

						<Button
							variant="outlined"
							onClick={() => setResetPasswordOpen(true)}
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							Recuperar Senha
						</Button>
					</Stack>
				</Stack>
			</SectionCard>

			{/* Dialog - Mudar Senha */}
			<Dialog
				open={changePasswordOpen}
				onClose={() => setChangePasswordOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Mudar Senha</DialogTitle>
				<DialogContent sx={{ pt: 2 }}>
					<Stack
						component="form"
						spacing={1.5}
						onSubmit={handleChangePasswordSubmit}
						id="change-password-form"
					>
						<TextField
							label="Senha atual"
							type="password"
							value={changePasswordForm.senha_atual}
							onChange={(event) =>
								setChangePasswordForm((current) => ({
									...current,
									senha_atual: event.target.value,
								}))
							}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							label="Nova senha"
							type="password"
							value={changePasswordForm.senha_nova}
							onChange={(event) =>
								setChangePasswordForm((current) => ({
									...current,
									senha_nova: event.target.value,
								}))
							}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							label="Confirmar nova senha"
							type="password"
							value={changePasswordForm.confirmar_senha_nova}
							onChange={(event) =>
								setChangePasswordForm((current) => ({
									...current,
									confirmar_senha_nova: event.target.value,
								}))
							}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						{changePasswordError ? (
							<Alert severity="error">{changePasswordError}</Alert>
						) : null}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={() => setChangePasswordOpen(false)}>Cancelar</Button>
					<Button
						type="submit"
						form="change-password-form"
						variant="contained"
						disabled={changePasswordMutation.isPending}
					>
						{changePasswordMutation.isPending ? 'Salvando...' : 'Mudar Senha'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Dialog - Recuperar Senha */}
			<Dialog
				open={resetPasswordOpen}
				onClose={() => setResetPasswordOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>Recuperar Senha</DialogTitle>
				<DialogContent sx={{ pt: 2 }}>
					<Stack
						component="form"
						spacing={1.5}
						onSubmit={handleResetPasswordSubmit}
						id="reset-password-form"
					>
						<Typography variant="body2" color="text.secondary">
							Digite seu CPF para solicitar a recuperação de senha.
						</Typography>

						<TextField
							label="CPF"
							value={resetPasswordForm.cpf}
							onChange={(event) =>
								setResetPasswordForm((current) => ({ ...current, cpf: normalizeCpf(event.target.value) }))
							}
							required
							fullWidth
							helperText="Use apenas números."
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						{resetPasswordError ? (
							<Alert severity="error">{resetPasswordError}</Alert>
						) : null}

						{resetPasswordSuccess ? (
							<Alert severity="success">
								Solicitação registrada com sucesso.
							</Alert>
						) : null}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button onClick={() => setResetPasswordOpen(false)}>Cancelar</Button>
					<Button
						type="submit"
						form="reset-password-form"
						variant="contained"
						disabled={resetPasswordMutation.isPending}
					>
						{resetPasswordMutation.isPending ? 'Enviando...' : 'Enviar Link'}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
};

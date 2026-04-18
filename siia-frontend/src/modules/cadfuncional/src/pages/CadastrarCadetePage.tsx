import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import {
	Alert,
	Button,
	Checkbox,
	Divider,
	FormControlLabel,
	LinearProgress,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';
import axios from 'axios';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { SectionCard, useNotify } from '../design-system';
import { useBulkCreateMilitaresCsv, useCreateMilitar } from '../hooks/usePessoal';
import type { BulkCsvResult } from '../types/pessoal';
import type { CreateMilitarPayload } from '../types/pessoal';

interface FormState {
	nr_militar: string;
	nome_completo: string;
	nome_guerra: string;
	sexo: string;
	turma: string;
	ano: string;
	posto_graduacao: string;
	curso: string;
	companhia: string;
	pelotao: string;
	is_instrutor: boolean;
}

const initialFormState: FormState = {
	nr_militar: '',
	nome_completo: '',
	nome_guerra: '',
	sexo: '',
	turma: '',
	ano: '',
	posto_graduacao: '',
	curso: '',
	companhia: '',
	pelotao: '',
	is_instrutor: false,
};

const postosGrad = ['Cadete', 'Aluno(a)'];

const anosOpcoes = ['1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano'];

const cursosOpcoes = [
	'EsPCEx',
	'Básico',
	'Artilharia',
	'Cavalaria',
	'Engenharia',
	'Comunicações',
	'Infantaria',
	'Intendência',
	'Material Bélico',
];

const getErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		const detail = error.response?.data?.detail;
		if (typeof detail === 'string' && detail.trim()) {
			return detail;
		}
	}

	return 'Não foi possível cadastrar o cadete.';
};

const formatBulkErro = (erro: { linha: number; erro: string | Record<string, string[]> }): string => {
	if (typeof erro.erro === 'string') return `Linha ${erro.linha}: ${erro.erro}`;
	const msgs = Object.entries(erro.erro)
		.map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
		.join('; ');
	return `Linha ${erro.linha}: ${msgs}`;
};

export const CadastrarCadetePage = () => {
	const navigate = useNavigate();
	const notify = useNotify();
	const createMilitarMutation = useCreateMilitar();
	const bulkCsvMutation = useBulkCreateMilitaresCsv();
	const [formData, setFormData] = useState<FormState>(initialFormState);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const fileInputRef = useRef<HTMLInputElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [bulkResult, setBulkResult] = useState<BulkCsvResult | null>(null);
	const [bulkError, setBulkError] = useState<string | null>(null);

	const handleChange = (field: keyof FormState, value: string | boolean) => {
		setFormData((current) => ({
			...current,
			[field]: value,
		}));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitError(null);

		const payload: CreateMilitarPayload = {
			nr_militar: formData.nr_militar.trim(),
			nome_completo: formData.nome_completo.trim(),
			nome_guerra: formData.nome_guerra.trim(),
			sexo: formData.sexo.trim(),
			turma: formData.turma.trim(),
			ano: formData.ano,
			posto_graduacao: formData.posto_graduacao,
			curso: formData.curso,
			companhia: formData.companhia.trim(),
			pelotao: formData.pelotao.trim(),
			is_instrutor: formData.is_instrutor,
		};

		try {
			await createMilitarMutation.mutateAsync(payload);
			notify('Cadete cadastrado com sucesso.', 'success');
			setFormData(initialFormState);
		} catch (error) {
			const message = getErrorMessage(error);
			setSubmitError(message);
			notify(message, 'error');
		}
	};

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0] ?? null;
		setSelectedFile(file);
		setBulkResult(null);
		setBulkError(null);
	};

	const handleBulkUpload = async () => {
		if (!selectedFile) return;
		setBulkResult(null);
		setBulkError(null);

		try {
			const result = await bulkCsvMutation.mutateAsync(selectedFile);
			setBulkResult(result);
			if (result.total_criados > 0) {
				notify(`${result.total_criados} cadete(s) cadastrado(s) com sucesso.`, 'success');
			}
			if (result.total_atualizados > 0) {
				notify(`${result.total_atualizados} cadete(s) atualizado(s) com sucesso.`, 'info');
			}
			if (result.total_erros > 0) {
				notify(`${result.total_erros} linha(s) com erro.`, 'warning');
			}
		} catch (error) {
			const message = getErrorMessage(error);
			setBulkError(message);
			notify(message, 'error');
		} finally {
			setSelectedFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}
		}
	};

	return (
		<Stack spacing={2}>
			<Typography variant="h5">+ Cadastrar Cadete</Typography>

			<SectionCard title="Novo Cadastro" subtitle="Preencha os dados do cadete para habilitar atendimentos clínicos.">
				<Stack component="form" spacing={1.5} onSubmit={handleSubmit}>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Nr"
							value={formData.nr_militar}
							onChange={(event) => handleChange('nr_militar', event.target.value)}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							label="Nome Completo"
							value={formData.nome_completo}
							onChange={(event) => handleChange('nome_completo', event.target.value)}
							required
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							select
							label="Posto/Grad"
							value={formData.posto_graduacao}
							onChange={(event) => handleChange('posto_graduacao', event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Selecione</MenuItem>
							{postosGrad.map((pg) => (
								<MenuItem key={pg} value={pg}>{pg}</MenuItem>
							))}
						</TextField>
						<TextField
							label="Nome de Guerra"
							value={formData.nome_guerra}
							onChange={(event) => handleChange('nome_guerra', event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Sexo"
							value={formData.sexo}
							onChange={(event) => handleChange('sexo', event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							label="Turma"
							value={formData.turma}
							onChange={(event) => handleChange('turma', event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							select
							label="Ano"
							value={formData.ano}
							onChange={(event) => handleChange('ano', event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Selecione</MenuItem>
							{anosOpcoes.map((a) => (
								<MenuItem key={a} value={a}>{a}</MenuItem>
							))}
						</TextField>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							select
							label="Curso"
							value={formData.curso}
							onChange={(event) => handleChange('curso', event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Selecione</MenuItem>
							{cursosOpcoes.map((c) => (
								<MenuItem key={c} value={c}>{c}</MenuItem>
							))}
						</TextField>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Subunidade"
							value={formData.companhia}
							onChange={(event) => handleChange('companhia', event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							label="Fração"
							value={formData.pelotao}
							onChange={(event) => handleChange('pelotao', event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<FormControlLabel
						control={
							<Checkbox
								checked={formData.is_instrutor}
								onChange={(event) => handleChange('is_instrutor', event.target.checked)}
							/>
						}
						label="Marcar como Instrutor"
					/>

					{submitError ? <Alert severity="error">{submitError}</Alert> : null}

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<Button
							type="submit"
							variant="contained"
							disabled={createMilitarMutation.isPending}
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							{createMilitarMutation.isPending ? 'Salvando...' : 'Salvar Cadete'}
						</Button>
						<Button
							variant="outlined"
							component={RouterLink}
							to="/dashboard/cadfuncional/cadetes-pacientes"
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							Ver Cadetes
						</Button>
						<Button
							variant="text"
							type="button"
							onClick={() => navigate('/dashboard/cadfuncional')}
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							Voltar ao Dashboard
						</Button>
					</Stack>
				</Stack>
			</SectionCard>

			<Divider />

			<SectionCard
				title="Carga em Lote (CSV)"
				subtitle="Envie um arquivo .csv com os cadetes para cadastro em massa. Colunas obrigatórias: nr_militar, nome_completo (ou cabeçalhos equivalentes como Nr e Nome Completo). Opcionais: nome_guerra, sexo, turma, ano, posto_graduacao (Posto/Graduação), arma_quadro_servico, curso, companhia (Subunidade), pelotao (Fração). is_instrutor: não é o caso."
			>
				<Stack spacing={1.5}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
						<Button
							variant="outlined"
							component="label"
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							Selecionar arquivo CSV
							<input
								ref={fileInputRef}
								type="file"
								accept=".csv"
								hidden
								onChange={handleFileChange}
							/>
						</Button>
						{selectedFile ? (
							<Typography variant="body2" color="text.secondary">
								{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
							</Typography>
						) : null}
					</Stack>

					<Button
						variant="contained"
						onClick={handleBulkUpload}
						disabled={!selectedFile || bulkCsvMutation.isPending}
						sx={{ minHeight: 44, minWidth: 44, alignSelf: 'flex-start' }}
					>
						{bulkCsvMutation.isPending ? 'Enviando...' : 'Enviar CSV'}
					</Button>

					{bulkCsvMutation.isPending ? <LinearProgress /> : null}

					{bulkError ? <Alert severity="error">{bulkError}</Alert> : null}

					{bulkResult ? (
						<Stack spacing={1}>
							<Alert severity={bulkResult.total_erros === 0 ? 'success' : 'warning'}>
								{bulkResult.total_criados} cadastrado(s), {bulkResult.total_atualizados} atualizado(s), {bulkResult.total_sem_alteracao} sem alteração de {bulkResult.total_enviados} linha(s).
								{bulkResult.total_erros > 0 ? ` ${bulkResult.total_erros} erro(s).` : ''}
							</Alert>
							{bulkResult.erros.length > 0 ? (
								<Alert severity="error" sx={{ maxHeight: 200, overflow: 'auto' }}>
									<Typography variant="subtitle2" gutterBottom>Erros por linha:</Typography>
									{bulkResult.erros.map((e, i) => (
										<Typography key={i} variant="body2">
											{formatBulkErro(e)}
										</Typography>
									))}
								</Alert>
							) : null}
						</Stack>
					) : null}
				</Stack>
			</SectionCard>
		</Stack>
	);
};

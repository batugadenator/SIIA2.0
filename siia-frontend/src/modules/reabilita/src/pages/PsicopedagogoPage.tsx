import { useMemo, useState } from 'react';

import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	LinearProgress,
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
import { useNavigate } from 'react-router-dom';

import type { Atendimento } from '../types/atendimento';
import type {
	CreateIntervencaoPsicopedagogicaPayload,
	IntervencaoPsicopedagogica,
} from '../types/psicopedagogia';

import { FilterActionsRow } from '../components/common';
import { EmptyState, SectionCard, useNotify } from '../design-system';
import { useAtendimentos } from '../hooks/useAtendimentos';
import { useMilitares } from '../hooks/usePessoal';
import {
	useCreateIntervencaoPsicopedagogica,
	useIntervencoesPsicopedagogicas,
	useSredResumoCompartilhado,
} from '../hooks/usePsicopedagogia';

const formatDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('pt-BR');
};

const normalizeEncaminhamento = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();

const ENCAMINHAMENTO_PSICOPEDAGOGIA_ALIASES = new Set([
	'psicopedagogo',
	'psicopedagoga',
	'psicopedagogia',
	'pedagogo',
	'pedagoga',
]);

const MOTIVO_ATENDIMENTO_OPTIONS = [
	'Atendimento Inicial',
	'Atendimento de Acompanhamento',
	'Trancamento/Desligamento',
	'Desempenho Acadêmico em Geral',
	'Avaliação Atitudinal',
	'Questões pessoais',
	'Saúde Geral',
	'Saúde Mental',
	'Em acompanhamento no Cadete Funcional',
] as const;

const isEncaminhadoParaPsicopedagogo = (atendimento: Atendimento): boolean => {
	const encaminhamentos = atendimento.encaminhamentos_multidisciplinares ?? [];
	return encaminhamentos.some((item) =>
		ENCAMINHAMENTO_PSICOPEDAGOGIA_ALIASES.has(normalizeEncaminhamento(item)),
	);
};

/** Verifica indicadores de saúde mental relevantes no atendimento. */
const classificarSaudeMental = (atendimento: Atendimento): string | null => {
	if (atendimento.flag_sred) return 'Acompanhar (S-RED)';
	const notas = (atendimento.notas_clinicas || '').toLowerCase();
	if (/bradifr[eê]nia|lentifica/i.test(notas)) return 'Bradifrenia (notas)';
	if (/sa[uú]de\s*mental|depress|ansiedade|estresse\s*psic/i.test(notas)) return 'Saúde mental (notas)';
	return null;
};

interface PsicoFormState {
	data_atendimento: string;
	motivo_atendimento: string;
	encaminhamentos_realizados: string;
	observacoes: string;
}

const INITIAL_FORM: PsicoFormState = {
	data_atendimento: '',
	motivo_atendimento: '',
	encaminhamentos_realizados: '',
	observacoes: '',
};

const getErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data;
		const detail = error.response?.data?.detail;
		if (typeof detail === 'string' && detail.trim()) {
			return detail;
		}

		if (data && typeof data === 'object') {
			const mensagens = Object.values(data)
				.flatMap((value) => (Array.isArray(value) ? value : [value]))
				.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

			if (mensagens.length > 0) {
				return mensagens.join(' ');
			}
		}
	}
	return 'Não foi possível salvar a intervenção psicopedagógica.';
};

const formatDateTime = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString('pt-BR');
};

const truncate = (text: string, max = 80): string =>
	text.length > max ? `${text.slice(0, max)}…` : text || '—';

const resumoChipSx = {
	maxWidth: { xs: '100%', sm: 'none' },
	'& .MuiChip-label': {
		maxWidth: { xs: 220, sm: 'none' },
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
};

const colunaSecundariaSx = { display: { xs: 'none', sm: 'table-cell' } };

export const PsicopedagogoPage = () => {
	const notify = useNotify();
	const { data, isLoading, isError, refetch } = useAtendimentos();
	const { data: militares } = useMilitares();
	const navigate = useNavigate();
	const [busca, setBusca] = useState('');
	const [apenasRelevantes, setApenasRelevantes] = useState(false);
	const [selectedAtendimentoId, setSelectedAtendimentoId] = useState<number | null>(null);
	const [form, setForm] = useState<PsicoFormState>(INITIAL_FORM);

	const militarById = useMemo(() => {
		const map = new Map<number, { posto_graduacao: string }>();
		for (const item of militares ?? []) {
			map.set(item.id, { posto_graduacao: item.posto_graduacao });
		}
		return map;
	}, [militares]);

	const atendimentos = useMemo(() => {
		const lista = (data ?? []).filter(isEncaminhadoParaPsicopedagogo);
		const buscaNorm = busca.trim().toLowerCase();

		return lista.filter((item) => {
			if (apenasRelevantes && !classificarSaudeMental(item)) return false;

			if (buscaNorm) {
				const texto = [item.estrutura_anatomica, item.notas_clinicas]
					.join(' ')
					.toLowerCase();
				if (!texto.includes(buscaNorm)) return false;
			}
			return true;
		});
	}, [data, busca, apenasRelevantes]);

	const atendimentoSelecionado = useMemo(
		() => atendimentos.find((item) => item.id === selectedAtendimentoId) ?? null,
		[atendimentos, selectedAtendimentoId],
	);

	const { data: intervencoes, refetch: refetchIntervencoes } = useIntervencoesPsicopedagogicas(
		selectedAtendimentoId ?? undefined,
	);
	const { data: resumoCompartilhado } = useSredResumoCompartilhado(selectedAtendimentoId ?? undefined);
	const createIntervencaoMutation = useCreateIntervencaoPsicopedagogica(selectedAtendimentoId ?? undefined);

	const handleSaveIntervencao = async () => {
		if (!selectedAtendimentoId) {
			notify('Selecione um atendimento para registrar a intervenção.', 'warning');
			return;
		}

		const payload: CreateIntervencaoPsicopedagogicaPayload = {
			atendimento_id: selectedAtendimentoId,
			data_atendimento: form.data_atendimento || null,
			motivo_atendimento: form.motivo_atendimento,
			encaminhamentos_realizados: form.encaminhamentos_realizados,
			observacoes: form.observacoes,
		};

		try {
			await createIntervencaoMutation.mutateAsync(payload);
			notify('Intervenção psicopedagógica registrada com sucesso.', 'success');
			setForm(INITIAL_FORM);
			void refetchIntervencoes();
		} catch (error) {
			notify(getErrorMessage(error), 'error');
		}
	};

	if (isLoading) {
		return (
			<Stack alignItems="center" justifyContent="center" py={8}>
				<CircularProgress />
			</Stack>
		);
	}

	if (isError) {
		return (
			<SectionCard title="Psicopedagogia — Módulo Mental">
				<EmptyState
					title="Erro ao carregar atendimentos"
					description="Não foi possível obter os dados. Tente novamente."
					action={<Button onClick={() => refetch()}>Tentar novamente</Button>}
				/>
			</SectionCard>
		);
	}

	return (
		<Stack spacing={3} p={2}>
			<Typography variant="h5" fontWeight={600}>
				Módulo Psicopedagogia — S-RED Cognitivo e Carga de Aprendizagem
			</Typography>

			<Alert severity="info" variant="outlined">
				Intervenções psicopedagógicas com foco em fadiga cognitiva, atenção sustentada e progressão segura de carga mental.
			</Alert>

			<SectionCard title="Filtros">
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
					<TextField
						label="Buscar"
						placeholder="Notas clínicas…"
						size="small"
						value={busca}
						onChange={(e) => setBusca(e.target.value)}
						sx={{ minWidth: 220 }}
					/>
					<Button
						variant={apenasRelevantes ? 'contained' : 'outlined'}
						size="small"
						onClick={() => setApenasRelevantes((v) => !v)}
						sx={{ minHeight: 44, minWidth: 44 }}
					>
						{apenasRelevantes ? 'Mostrando relevantes' : 'Filtrar relevantes'}
					</Button>
				</Stack>
				<FilterActionsRow
					refreshLabel="Atualizar"
					onRefresh={() => { refetch(); }}
					onClear={() => {
						setBusca('');
						setApenasRelevantes(false);
					}}
				/>
			</SectionCard>

			<SectionCard title="Atendimentos — Psicopedagogia">
				{atendimentos.length === 0 ? (
					<EmptyState
						title="Nenhum atendimento encontrado"
						description="Ajuste os filtros ou aguarde novos registros."
					/>
				) : (
					<TableContainer sx={{ overflowX: 'auto' }}>
						<Table size="small" sx={{ minWidth: 980, '& th': { whiteSpace: 'nowrap' } }}>
							<TableHead>
								<TableRow>
									<TableCell sx={colunaSecundariaSx}>Posto/Grad</TableCell>
									<TableCell>Nr</TableCell>
									<TableCell>Nome de Guerra</TableCell>
									<TableCell>Data</TableCell>
									<TableCell>S-RED</TableCell>
									<TableCell sx={colunaSecundariaSx}>Decisão S-RED</TableCell>
									<TableCell>Detalhes</TableCell>
									<TableCell>Ação</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{atendimentos.map((atd) => {
									return (
										<TableRow key={atd.id} selected={selectedAtendimentoId === atd.id}>
											<TableCell sx={colunaSecundariaSx}>
												{militarById.get(atd.cadete_id)?.posto_graduacao || 'Aluno(a) ou Cadete'}
											</TableCell>
											<TableCell>{atd.cadete_nr_militar || '—'}</TableCell>
											<TableCell>{atd.cadete_nome_guerra || '—'}</TableCell>
											<TableCell>{formatDate(atd.data_registro)}</TableCell>
											<TableCell>
												{atd.flag_sred ? (
													<Chip label="S-RED" color="error" size="small" />
												) : (
													'—'
												)}
											</TableCell>
											<TableCell sx={colunaSecundariaSx}>{atd.decisao_sred || '—'}</TableCell>
											<TableCell>
												<Button
													size="small"
													variant="outlined"
													onClick={() => navigate(`/psicopedagogia/atendimento/${atd.id}/detalhes`)}
													sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
												>
													Detalhes
												</Button>
											</TableCell>
											<TableCell>
												<Button
													size="small"
													variant={selectedAtendimentoId === atd.id ? 'contained' : 'outlined'}
													onClick={() => setSelectedAtendimentoId(atd.id)}
												sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
												>
													Vincular
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</SectionCard>

			<SectionCard title="Resumo Interdisciplinar S-RED">
				{!atendimentoSelecionado ? (
					<Alert severity="warning">Selecione um atendimento para carregar o resumo compartilhado da equipe.</Alert>
				) : !resumoCompartilhado ? (
					<LinearProgress />
				) : (
					<Stack spacing={1.25}>
						<Typography variant="body2">
							Cadete: {resumoCompartilhado.atendimento.cadete_nome} • Atendimento #{resumoCompartilhado.atendimento.id}
						</Typography>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
							<Chip label={`Fisio: ${resumoCompartilhado.fisioterapia.reatividade || 'Sem avaliação'}`} size="small" sx={resumoChipSx} />
							<Chip
								label={`EVA: ${
									resumoCompartilhado.fisioterapia.gravidade_eva !== null
										? resumoCompartilhado.fisioterapia.gravidade_eva
										: '—'
								}`}
								variant="outlined"
								size="small"
								sx={resumoChipSx}
							/>
							<Chip
								label={`PEF 24h: ${resumoCompartilhado.educacao_fisica.reatividade_24h || 'Sem sessão'}`}
								variant="outlined"
								size="small"
								sx={resumoChipSx}
							/>
							<Chip
								label={`Fadiga cognitiva: ${
									resumoCompartilhado.psicopedagogia.indice_fadiga_cognitiva !== null
										? resumoCompartilhado.psicopedagogia.indice_fadiga_cognitiva
										: '—'
								}`}
								color="secondary"
								size="small"
								sx={resumoChipSx}
							/>
						</Stack>
					</Stack>
				)}
			</SectionCard>

			<SectionCard title="Registrar Intervenção Psicopedagógica">
				<Stack spacing={1.5}>
					{!atendimentoSelecionado ? (
						<Alert severity="info">Selecione um atendimento para habilitar o registro da intervenção.</Alert>
					) : null}
					<TextField
						label="Data do Atendimento"
						type="date"
						value={form.data_atendimento}
						onChange={(e) => setForm((c) => ({ ...c, data_atendimento: e.target.value }))}
						InputLabelProps={{ shrink: true }}
						fullWidth
						disabled={!atendimentoSelecionado}
						sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
					/>
					<TextField
						select
						label="Motivo do Atendimento"
						value={form.motivo_atendimento}
						onChange={(e) => setForm((c) => ({ ...c, motivo_atendimento: e.target.value }))}
						fullWidth
						disabled={!atendimentoSelecionado}
						sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
					>
						<MenuItem value="">— Selecione —</MenuItem>
						{MOTIVO_ATENDIMENTO_OPTIONS.map((op) => (
							<MenuItem key={op} value={op}>
								{op}
							</MenuItem>
						))}
					</TextField>
					<TextField
						label="Encaminhamentos realizados"
						value={form.encaminhamentos_realizados}
						onChange={(e) => setForm((c) => ({ ...c, encaminhamentos_realizados: e.target.value }))}
						multiline
						minRows={3}
						fullWidth
						disabled={!atendimentoSelecionado}
						sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
					/>
					<TextField
						label="Observações"
						value={form.observacoes}
						onChange={(e) => setForm((c) => ({ ...c, observacoes: e.target.value }))}
						multiline
						minRows={3}
						fullWidth
						disabled={!atendimentoSelecionado}
						sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
					/>
					<Button
						variant="contained"
						onClick={() => {
							void handleSaveIntervencao();
						}}
						disabled={!atendimentoSelecionado || createIntervencaoMutation.isPending}
						sx={{ minHeight: 44 }}
					>
						{createIntervencaoMutation.isPending ? 'Salvando...' : 'Salvar Intervenção'}
					</Button>
				</Stack>
			</SectionCard>

			<SectionCard title="Histórico Psicopedagógico">
				{!atendimentoSelecionado ? (
					<EmptyState
						title="Selecione um atendimento"
						description="Após selecionar, o histórico de intervenções será exibido aqui."
					/>
				) : (intervencoes ?? []).length === 0 ? (
					<EmptyState
						title="Sem intervenções registradas"
						description="Registre a primeira intervenção para iniciar o histórico psicopedagógico."
					/>
				) : (
					<TableContainer sx={{ overflowX: 'auto' }}>
						<Table size="small" sx={{ minWidth: 900, '& th': { whiteSpace: 'nowrap' } }}>
							<TableHead>
								<TableRow>
									<TableCell>Data/Hora do Lançamento</TableCell>
									<TableCell>Data do Atendimento</TableCell>
									<TableCell sx={colunaSecundariaSx}>Motivo do Atendimento</TableCell>
									<TableCell>Encaminhamento Realizado</TableCell>
									<TableCell sx={colunaSecundariaSx}>Observações</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{(intervencoes ?? []).map((item: IntervencaoPsicopedagogica) => (
									<TableRow key={item.id}>
										<TableCell>{formatDateTime(item.criado_em)}</TableCell>
										<TableCell>
											{item.data_atendimento ? formatDate(item.data_atendimento) : '—'}
										</TableCell>
										<TableCell sx={colunaSecundariaSx}>{item.motivo_atendimento || '—'}</TableCell>
										<TableCell sx={{ maxWidth: 240 }}>
											{truncate(item.encaminhamentos_realizados)}
										</TableCell>
										<TableCell sx={{ maxWidth: 240, ...colunaSecundariaSx }}>
											{truncate(item.observacoes)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</SectionCard>
		</Stack>
	);
};

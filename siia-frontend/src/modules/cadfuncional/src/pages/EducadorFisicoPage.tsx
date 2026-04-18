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

import { FilterActionsRow } from '../components/common';
import { EmptyState, SectionCard, useNotify } from '../design-system';
import { useAtendimentos, useAvaliacoesFisioterapiaSRED } from '../hooks/useAtendimentos';
import {
	useCreateSessaoTreinoPEF,
	useEducacaoFisicaEvolucaoCarga,
	useSessoesTreinoPEF,
} from '../hooks/useEducacaoFisica';
import { useMilitares } from '../hooks/usePessoal';
import type { Lateralidade } from '../types/atendimento';
import type { CreateSessaoTreinoPEFPayload, LatenciaDorPEF, ReatividadePEF } from '../types/educacaoFisica';

const lateralidadeOptions: Lateralidade[] = ['Direita', 'Esquerda', 'Bilateral', 'Não é o caso'];
const reatividadeOptions: ReatividadePEF[] = ['Baixa', 'Moderada', 'Alta'];
const latenciaOptions: LatenciaDorPEF[] = ['Imediata', 'Até 24h', 'Até 48h', 'Após 48h', 'Sem dor'];

interface PEFFormState {
	deficit_forca_percentual: string;
	pse_paciente: string;
	series: string;
	repeticoes: string;
	carga_utilizada_kg: string;
	volume_treino_semanal: string;
	reatividade_durante: ReatividadePEF;
	reatividade_24h: ReatividadePEF;
	reatividade_48h: ReatividadePEF;
	latencia_dor: LatenciaDorPEF;
	analise_biomecanica: string;
	objetivo_condicionamento: string;
	observacoes: string;
}

const INITIAL_PEF_FORM: PEFFormState = {
	deficit_forca_percentual: '',
	pse_paciente: '',
	series: '3',
	repeticoes: '10',
	carga_utilizada_kg: '',
	volume_treino_semanal: '',
	reatividade_durante: 'Baixa',
	reatividade_24h: 'Baixa',
	reatividade_48h: 'Baixa',
	latencia_dor: 'Sem dor',
	analise_biomecanica: '',
	objetivo_condicionamento: '',
	observacoes: '',
};

const normalizeEncaminhamento = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();

const isEncaminhadoParaEducadorFisico = (atendimento: { encaminhamentos_multidisciplinares: string[] }): boolean => {
	const encaminhamentos = atendimento.encaminhamentos_multidisciplinares ?? [];
	return encaminhamentos.some((item) => {
		const normalized = normalizeEncaminhamento(item);
		return normalized === 'educador fisico' || normalized === 'profissional de educacao fisica';
	});
};

const colunaSecundariaSx = { display: { xs: 'none', sm: 'table-cell' } };

const formatDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('pt-BR');
};

const resumoChipSx = {
	maxWidth: { xs: '100%', sm: 'none' },
	'& .MuiChip-label': {
		maxWidth: { xs: 220, sm: 'none' },
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
};

const reatividadeSeverity = (reatividade?: string): 'success' | 'warning' | 'error' | 'default' => {
	if (reatividade === 'Baixa') return 'success';
	if (reatividade === 'Moderada') return 'warning';
	if (reatividade === 'Alta') return 'error';
	return 'default';
};

const getErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		const detail = error.response?.data?.detail;
		if (typeof detail === 'string' && detail.trim()) {
			return detail;
		}
	}
	return 'Não foi possível salvar a sessão de treino do PEF.';
};

export const EducadorFisicoPage = () => {
	const notify = useNotify();
	const { data, isLoading, isError, refetch } = useAtendimentos();
	const { data: militares } = useMilitares();
	const navigate = useNavigate();
	const [busca, setBusca] = useState('');
	const [lateralidadeFiltro, setLateralidadeFiltro] = useState<Lateralidade | ''>('');
	const [selectedAtendimentoId, setSelectedAtendimentoId] = useState<number | null>(null);
	const [form, setForm] = useState<PEFFormState>(INITIAL_PEF_FORM);

	const militarById = useMemo(() => {
		const map = new Map<number, { posto_graduacao: string }>();
		for (const item of militares ?? []) {
			map.set(item.id, { posto_graduacao: item.posto_graduacao });
		}
		return map;
	}, [militares]);

	const atendimentos = useMemo(() => {
		const lista = (data ?? []).filter(isEncaminhadoParaEducadorFisico);
		const buscaNorm = busca.trim().toLowerCase();

		return lista.filter((item) => {
			if (lateralidadeFiltro && item.lateralidade !== lateralidadeFiltro) return false;

			if (buscaNorm) {
				const texto = [
					item.estrutura_anatomica,
					item.localizacao_lesao,
					item.tipo_lesao,
					item.lateralidade,
					item.notas_clinicas,
				]
					.join(' ')
					.toLowerCase();
				if (!texto.includes(buscaNorm)) return false;
			}
			return true;
		});
	}, [data, busca, lateralidadeFiltro]);

	const atendimentoSelecionado = useMemo(
		() => atendimentos.find((item) => item.id === selectedAtendimentoId) ?? null,
		[atendimentos, selectedAtendimentoId],
	);

	const { data: avaliacoesFisio } = useAvaliacoesFisioterapiaSRED(selectedAtendimentoId ?? undefined);
	const avaliacaoFisioAtual = avaliacoesFisio?.[0];
	const { data: sessoesPEF, refetch: refetchSessoesPEF } = useSessoesTreinoPEF(selectedAtendimentoId ?? undefined);
	const { data: evolucaoCarga } = useEducacaoFisicaEvolucaoCarga(selectedAtendimentoId ?? undefined);
	const createSessaoMutation = useCreateSessaoTreinoPEF(selectedAtendimentoId ?? undefined);
	const tonelagemMaxReatividadeAlta = sessoesPEF?.[0]?.tonelagem_max_reatividade_alta ?? 600;
	const bloqueadoPorGovernanca = Boolean(
		selectedAtendimentoId && evolucaoCarga && !evolucaoCarga.limite_clinico.liberado_para_pef,
	);

	const tonelagemAtual = useMemo(() => {
		const series = Number.parseFloat(form.series);
		const repeticoes = Number.parseFloat(form.repeticoes);
		const carga = Number.parseFloat(form.carga_utilizada_kg.replace(',', '.'));
		if (!Number.isFinite(series) || !Number.isFinite(repeticoes) || !Number.isFinite(carga)) {
			return 0;
		}
		return Math.round(series * repeticoes * carga * 100) / 100;
	}, [form.series, form.repeticoes, form.carga_utilizada_kg]);

	const historicoTonelagemMedia = useMemo(() => {
		const lista = evolucaoCarga?.items ?? [];
		if (lista.length === 0) return 0;
		const soma = lista.reduce((acc, item) => acc + Number(item.tonelagem_media), 0);
		return Math.round((soma / lista.length) * 100) / 100;
	}, [evolucaoCarga]);

	const handleSaveSessao = async () => {
		if (!selectedAtendimentoId) {
			notify('Selecione um atendimento para registrar a sessão de treino.', 'warning');
			return;
		}

		const payload: CreateSessaoTreinoPEFPayload = {
			atendimento_id: selectedAtendimentoId,
			avaliacao_fisioterapia_id: avaliacaoFisioAtual?.id ?? null,
			deficit_forca_percentual: Number.parseFloat(form.deficit_forca_percentual.replace(',', '.')),
			pse_paciente: Number.parseInt(form.pse_paciente, 10),
			series: Number.parseInt(form.series, 10),
			repeticoes: Number.parseInt(form.repeticoes, 10),
			carga_utilizada_kg: Number.parseFloat(form.carga_utilizada_kg.replace(',', '.')),
			volume_treino_semanal: Number.parseInt(form.volume_treino_semanal || '0', 10),
			reatividade_durante: form.reatividade_durante,
			reatividade_24h: form.reatividade_24h,
			reatividade_48h: form.reatividade_48h,
			latencia_dor: form.latencia_dor,
			analise_biomecanica: form.analise_biomecanica,
			objetivo_condicionamento: form.objetivo_condicionamento,
			observacoes: form.observacoes,
		};

		if (
			!Number.isFinite(payload.deficit_forca_percentual) ||
			!Number.isFinite(payload.pse_paciente) ||
			!Number.isFinite(payload.series) ||
			!Number.isFinite(payload.repeticoes) ||
			!Number.isFinite(payload.carga_utilizada_kg)
		) {
			notify('Preencha os campos numéricos obrigatórios com valores válidos.', 'error');
			return;
		}

		if (bloqueadoPorGovernanca) {
			notify('A progressão de carga está bloqueada até a liberação formal da fisioterapia.', 'warning');
			return;
		}

		if (avaliacaoFisioAtual?.reatividade === 'Alta' && tonelagemAtual > tonelagemMaxReatividadeAlta) {
			notify(
				`Reatividade Alta: a tonelagem da sessão deve ser <= ${tonelagemMaxReatividadeAlta} kg.`,
				'warning',
			);
			return;
		}

		try {
			await createSessaoMutation.mutateAsync(payload);
			notify('Sessão de treino registrada com sucesso.', 'success');
			setForm((current) => ({
				...INITIAL_PEF_FORM,
				reatividade_durante: current.reatividade_durante,
				reatividade_24h: current.reatividade_24h,
				reatividade_48h: current.reatividade_48h,
				latencia_dor: current.latencia_dor,
			}));
			void refetchSessoesPEF();
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
			<SectionCard title="Profissional de Educação Física — Reabilitação">
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
				Módulo Profissional de Educação Física — Condicionamento e Retorno à Função
			</Typography>

			<Alert severity="info" variant="outlined">
				Transição S-RED: o foco do PEF está em prescrição de carga e retorno funcional, usando a avaliação do fisioterapeuta
				como limite clínico para progressão.
			</Alert>

			<SectionCard title="Filtros">
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
					<TextField
						label="Buscar"
						placeholder="Estrutura, tipo lesão, notas..."
						size="small"
						value={busca}
						onChange={(e) => setBusca(e.target.value)}
						sx={{ minWidth: 220 }}
					/>
					<TextField
						label="Lateralidade"
						select
						size="small"
						value={lateralidadeFiltro}
						onChange={(e) => setLateralidadeFiltro(e.target.value as Lateralidade | '')}
						sx={{ minWidth: 180 }}
					>
						<MenuItem value="">Todas</MenuItem>
						{lateralidadeOptions.map((opt) => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				<FilterActionsRow
					refreshLabel="Atualizar"
					onRefresh={() => {
						void refetch();
					}}
					onClear={() => {
						setBusca('');
						setLateralidadeFiltro('');
					}}
				/>
			</SectionCard>

			<SectionCard title="Atendimentos Encaminhados — Profissional de Educação Física">
				{atendimentos.length === 0 ? (
					<EmptyState
						title="Nenhum atendimento encontrado"
						description="Ajuste os filtros ou aguarde novos registros encaminhados."
					/>
				) : (
					<TableContainer sx={{ overflowX: 'auto' }}>
						<Table size="small" sx={{ minWidth: 980, '& th': { whiteSpace: 'nowrap' } }}>
							<TableHead>
								<TableRow>
									<TableCell>Atendimento</TableCell>
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
								{atendimentos.map((atd) => (
									<TableRow key={atd.id} selected={selectedAtendimentoId === atd.id}>
										<TableCell>#{atd.id}</TableCell>
										<TableCell sx={colunaSecundariaSx}>
											{militarById.get(atd.cadete_id)?.posto_graduacao || 'Aluno(a) ou Cadete'}
										</TableCell>
										<TableCell>{atd.cadete_nr_militar || '—'}</TableCell>
										<TableCell>{atd.cadete_nome_guerra || '—'}</TableCell>
										<TableCell>{formatDate(atd.data_registro)}</TableCell>
										<TableCell>{atd.flag_sred ? <Chip label="S-RED" color="error" size="small" /> : '-'}</TableCell>
										<TableCell sx={colunaSecundariaSx}>
											{atd.flag_sred ? 'S-RED Positivo' : atd.decisao_sred || '—'}
										</TableCell>
										<TableCell>
											<Button
												size="small"
												variant="outlined"
												onClick={() => navigate(`/educador-fisico/atendimento/${atd.id}/detalhes`)}
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
												Vincular Sessão
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				)}
			</SectionCard>

			<SectionCard title="Status S-RED Atual (Base Fisioterapia)">
				{!atendimentoSelecionado ? (
					<Alert severity="warning">Selecione um atendimento na tabela para liberar o bloco de prescrição de carga.</Alert>
				) : (
					<Stack spacing={1.25}>
						<Typography variant="body2">
							Paciente: atendimento #{atendimentoSelecionado.id} • {atendimentoSelecionado.estrutura_anatomica}
						</Typography>
						{avaliacaoFisioAtual ? (
							<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
								<Chip
									label={`Reatividade Fisio: ${avaliacaoFisioAtual.reatividade}`}
									color={reatividadeSeverity(avaliacaoFisioAtual.reatividade)}
									size="small"
									sx={resumoChipSx}
								/>
								<Chip label={`EVA: ${avaliacaoFisioAtual.gravidade_eva}/10`} variant="outlined" size="small" sx={resumoChipSx} />
								<Chip label={`Etiologia: ${avaliacaoFisioAtual.etiologia}`} variant="outlined" size="small" sx={resumoChipSx} />
								<Chip
									label={
										avaliacaoFisioAtual.liberado_para_pef
											? 'Transição liberada para PEF'
											: 'Transição ainda não liberada'
									}
									color={avaliacaoFisioAtual.liberado_para_pef ? 'success' : 'warning'}
									size="small"
									sx={resumoChipSx}
								/>
							</Stack>
						) : (
							<Alert severity="info">
								Sem ficha fisioterapêutica registrada para este atendimento. O PEF pode registrar sessão, mas recomenda-se
								avaliação prévia da fisioterapia.
							</Alert>
						)}
					</Stack>
				)}
			</SectionCard>

			<SectionCard title="Programação de Treino (Carga e Retorno)">
				<Stack spacing={2}>
					{bloqueadoPorGovernanca ? (
						<Alert severity="warning">
							Bloqueado para progressão de carga: o fisioterapeuta ainda não registrou liberação formal para PEF.
						</Alert>
					) : null}
					{avaliacaoFisioAtual?.reatividade === 'Alta' ? (
						<Alert severity="warning">
							Reatividade Alta: limite operacional de tonelagem por sessão = {tonelagemMaxReatividadeAlta} kg.
						</Alert>
					) : null}
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Déficit de Força (%)"
							type="number"
							value={form.deficit_forca_percentual}
							onChange={(e) => setForm((c) => ({ ...c, deficit_forca_percentual: e.target.value }))}
							inputProps={{ min: 0, max: 100, step: 0.1 }}
							fullWidth
						/>
						<TextField
							label="PSE (Borg 0-10)"
							type="number"
							value={form.pse_paciente}
							onChange={(e) => setForm((c) => ({ ...c, pse_paciente: e.target.value }))}
							inputProps={{ min: 0, max: 10 }}
							fullWidth
						/>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Séries"
							type="number"
							value={form.series}
							onChange={(e) => setForm((c) => ({ ...c, series: e.target.value }))}
							inputProps={{ min: 1 }}
							fullWidth
						/>
						<TextField
							label="Repetições"
							type="number"
							value={form.repeticoes}
							onChange={(e) => setForm((c) => ({ ...c, repeticoes: e.target.value }))}
							inputProps={{ min: 1 }}
							fullWidth
						/>
						<TextField
							label="Carga (kg)"
							type="number"
							value={form.carga_utilizada_kg}
							onChange={(e) => setForm((c) => ({ ...c, carga_utilizada_kg: e.target.value }))}
							inputProps={{ min: 0, step: 0.1 }}
							fullWidth
						/>
						<TextField
							label="Volume Semanal"
							type="number"
							value={form.volume_treino_semanal}
							onChange={(e) => setForm((c) => ({ ...c, volume_treino_semanal: e.target.value }))}
							inputProps={{ min: 0 }}
							fullWidth
						/>
					</Stack>

					<Alert severity="info" variant="outlined">
						Tonelagem da sessão (automática): <strong>{tonelagemAtual.toLocaleString('pt-BR')} kg</strong>
					</Alert>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							select
							label="Reatividade durante"
							value={form.reatividade_durante}
							onChange={(e) => setForm((c) => ({ ...c, reatividade_durante: e.target.value as ReatividadePEF }))}
							fullWidth
						>
							{reatividadeOptions.map((item) => (
								<MenuItem key={item} value={item}>
									{item}
								</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="Reatividade 24h"
							value={form.reatividade_24h}
							onChange={(e) => setForm((c) => ({ ...c, reatividade_24h: e.target.value as ReatividadePEF }))}
							fullWidth
						>
							{reatividadeOptions.map((item) => (
								<MenuItem key={item} value={item}>
									{item}
								</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="Reatividade 48h"
							value={form.reatividade_48h}
							onChange={(e) => setForm((c) => ({ ...c, reatividade_48h: e.target.value as ReatividadePEF }))}
							fullWidth
						>
							{reatividadeOptions.map((item) => (
								<MenuItem key={item} value={item}>
									{item}
								</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="Latência da dor"
							value={form.latencia_dor}
							onChange={(e) => setForm((c) => ({ ...c, latencia_dor: e.target.value as LatenciaDorPEF }))}
							fullWidth
						>
							{latenciaOptions.map((item) => (
								<MenuItem key={item} value={item}>
									{item}
								</MenuItem>
							))}
						</TextField>
					</Stack>

					<TextField
						label="Análise biomecânica"
						placeholder="Ex.: valgo dinâmico no agachamento, compensação de tronco, déficit de controle excêntrico."
						value={form.analise_biomecanica}
						onChange={(e) => setForm((c) => ({ ...c, analise_biomecanica: e.target.value }))}
						multiline
						rows={2}
						fullWidth
					/>
					<TextField
						label="Objetivo de condicionamento"
						placeholder="Ex.: fortalecimento excêntrico de panturrilha e progressão para potência em cadeia posterior."
						value={form.objetivo_condicionamento}
						onChange={(e) => setForm((c) => ({ ...c, objetivo_condicionamento: e.target.value }))}
						multiline
						rows={2}
						fullWidth
					/>
					<TextField
						label="Observações"
						value={form.observacoes}
						onChange={(e) => setForm((c) => ({ ...c, observacoes: e.target.value }))}
						multiline
						rows={2}
						fullWidth
					/>

					<Button
						variant="contained"
						onClick={() => void handleSaveSessao()}
						disabled={!selectedAtendimentoId || createSessaoMutation.isPending || bloqueadoPorGovernanca}
						sx={{ alignSelf: 'flex-start', minHeight: 44 }}
					>
						{createSessaoMutation.isPending ? 'Salvando...' : 'Salvar Sessão PEF'}
					</Button>
				</Stack>
			</SectionCard>

			<SectionCard title="Evolução de Carga (Resumo S-RED)">
				<Stack spacing={1.5}>
					<Typography variant="body2" color="text.secondary">
						Leitura operacional: convergência esperada entre redução de reatividade e aumento progressivo de tonelagem.
					</Typography>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap flexWrap="wrap">
						<Chip label={`Tonelagem atual: ${tonelagemAtual.toLocaleString('pt-BR')} kg`} variant="outlined" size="small" sx={resumoChipSx} />
						<Chip label={`Média histórica: ${historicoTonelagemMedia.toLocaleString('pt-BR')} kg`} variant="outlined" size="small" sx={resumoChipSx} />
						{avaliacaoFisioAtual ? (
							<Chip
								label={`Reatividade Fisio: ${avaliacaoFisioAtual.reatividade}`}
								color={reatividadeSeverity(avaliacaoFisioAtual.reatividade)}
								size="small"
								sx={resumoChipSx}
							/>
						) : null}
					</Stack>
					<Stack spacing={0.75}>
						<Typography variant="caption">Carga planejada da sessão</Typography>
						<LinearProgress variant="determinate" value={Math.min((tonelagemAtual / 2000) * 100, 100)} sx={{ height: 10, borderRadius: 6 }} />
						<Typography variant="caption">Déficit de força atual</Typography>
						<LinearProgress
							variant="determinate"
							value={Math.min(Number.parseFloat(form.deficit_forca_percentual || '0'), 100)}
							sx={{ height: 10, borderRadius: 6 }}
						/>
					</Stack>
					{(evolucaoCarga?.items ?? []).length > 0 ? (
						<TableContainer sx={{ overflowX: 'auto' }}>
							<Table size="small" sx={{ minWidth: 760, '& th': { whiteSpace: 'nowrap' } }}>
								<TableHead>
									<TableRow>
										<TableCell>Semana</TableCell>
										<TableCell>Sessões</TableCell>
										<TableCell>Tonelagem média</TableCell>
										<TableCell>PSE médio</TableCell>
										<TableCell>Reatividade Fisio</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(evolucaoCarga?.items ?? []).map((item) => (
										<TableRow key={item.semana_ref}>
											<TableCell>{formatDate(item.semana_ref)}</TableCell>
											<TableCell>{item.sessoes}</TableCell>
											<TableCell>{item.tonelagem_media} kg</TableCell>
											<TableCell>{item.pse_medio}</TableCell>
											<TableCell>{item.reatividade_fisio || '-'}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					) : null}
				</Stack>
			</SectionCard>

			{selectedAtendimentoId && (
				<SectionCard title="Histórico de Sessões PEF (atendimento selecionado)">
					{(sessoesPEF ?? []).length === 0 ? (
						<EmptyState
							title="Sem sessões registradas"
							description="As sessões registradas aqui consolidam a fase de condicionamento pós-liberação clínica."
						/>
					) : (
						<TableContainer sx={{ overflowX: 'auto' }}>
							<Table size="small" sx={{ minWidth: 760, '& th': { whiteSpace: 'nowrap' } }}>
								<TableHead>
									<TableRow>
										<TableCell>Data</TableCell>
										<TableCell>PSE</TableCell>
										<TableCell>S/R/Carga</TableCell>
										<TableCell>Tonelagem</TableCell>
										<TableCell>Reatividade 24h</TableCell>
										<TableCell>Latência</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(sessoesPEF ?? []).map((sessao) => (
										<TableRow key={sessao.id}>
											<TableCell>{formatDate(sessao.criado_em)}</TableCell>
											<TableCell>{sessao.pse_paciente}</TableCell>
											<TableCell>
												{sessao.series}x{sessao.repeticoes} · {sessao.carga_utilizada_kg} kg
											</TableCell>
											<TableCell>{sessao.volume_tonelagem} kg</TableCell>
											<TableCell>
												<Chip label={sessao.reatividade_24h} color={reatividadeSeverity(sessao.reatividade_24h)} size="small" />
											</TableCell>
											<TableCell>{sessao.latencia_dor}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</SectionCard>
			)}
		</Stack>
	);
};

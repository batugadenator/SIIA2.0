import { useEffect, useMemo, useState } from 'react';

import {
	Alert,
	Button,
	Chip,
	CircularProgress,
	LinearProgress,
	MenuItem,
	Paper,
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
import { useNavigate } from 'react-router-dom';

import { EmptyState, SectionCard, useNotify } from '../design-system';
import {
	useAtendimentoDecisaoFinalInstrutor,
	useAtendimentoFluxoResumo,
	useAtendimentoFluxoTransicao,
	useAtendimentoNotasInstrutor,
	useAtendimentos,
	useAvaliacoesFisioterapiaSRED,
	useCreateAtendimentoNotaInstrutor,
} from '../hooks/useAtendimentos';
import { useSessoesTreinoPEF } from '../hooks/useEducacaoFisica';
import { useAvaliacoesNutricionais } from '../hooks/useNutricao';
import { useMilitares } from '../hooks/usePessoal';
import { useIntervencoesPsicopedagogicas } from '../hooks/usePsicopedagogia';
import type {
	EstadoFluxoAtendimento,
	ProntidaoInstrutor,
	SituacaoFinalInstrutor,
} from '../types/atendimento';

const formatDateTime = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
};

const formatDate = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('pt-BR');
};

const estadoLabel: Record<EstadoFluxoAtendimento, string> = {
	INICIAL: 'Inicial',
	MULTIDISCIPLINAR: 'Multidisciplinar',
	ACOMPANHAMENTO: 'Acompanhamento',
	DECISAO_FINAL: 'Decisão Final',
};

const fluxoProximoEstado = (estado: EstadoFluxoAtendimento): EstadoFluxoAtendimento | null => {
	if (estado === 'INICIAL') return 'MULTIDISCIPLINAR';
	if (estado === 'MULTIDISCIPLINAR') return 'ACOMPANHAMENTO';
	if (estado === 'ACOMPANHAMENTO') return 'DECISAO_FINAL';
	return null;
};

const situacaoFinalOptions: SituacaoFinalInstrutor[] = [
	'Recuperação Total',
	'Apto com Restrições',
	'Sugestão de Trancamento de Matrícula',
	'Outras Medidas Administrativas',
];

const prontidaoColor = (
	value: ProntidaoInstrutor,
): 'success' | 'warning' | 'error' | 'default' => {
	if (value === 'Recuperado') return 'success';
	if (value === 'Apto com Restrições') return 'warning';
	if (value === 'Totalmente Inapto') return 'error';
	return 'default';
};

const colunaSecundariaSx = { display: { xs: 'none', sm: 'table-cell' } };
const resumoChipSx = {
	maxWidth: { xs: '100%', sm: 'none' },
	'& .MuiChip-label': {
		maxWidth: { xs: 220, sm: 'none' },
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
};

interface TimelineItem {
	id: string;
	data: string;
	perfil: 'Médico' | 'Fisioterapia' | 'Nutrição' | 'PEF' | 'Psicopedagogia' | 'Instrutor';
	titulo: string;
	descricao: string;
}

export const InstrutorPage = () => {
	const notify = useNotify();
	const navigate = useNavigate();
	const { data: militares } = useMilitares();
	const { data: atendimentos, isLoading, isError, refetch } = useAtendimentos();
	const [filtroBusca, setFiltroBusca] = useState('');
	const [atendimentoSelecionadoId, setAtendimentoSelecionadoId] = useState<number | null>(null);
	const [notaCampo, setNotaCampo] = useState('');
	const [sugestaoAdministrativa, setSugestaoAdministrativa] = useState('');
	const [situacaoFinal, setSituacaoFinal] = useState<SituacaoFinalInstrutor | ''>('');

	const atendimentoSelecionado = useMemo(
		() => atendimentos?.find((item) => item.id === atendimentoSelecionadoId) ?? null,
		[atendimentos, atendimentoSelecionadoId],
	);

	const militarById = useMemo(() => {
		const map = new Map<number, { posto_graduacao: string }>();
		for (const item of militares ?? []) {
			map.set(item.id, { posto_graduacao: item.posto_graduacao });
		}
		return map;
	}, [militares]);

	useEffect(() => {
		if (!atendimentos || atendimentos.length === 0 || atendimentoSelecionadoId) {
			return;
		}
		setAtendimentoSelecionadoId(atendimentos[0].id);
	}, [atendimentos, atendimentoSelecionadoId]);

	const { data: fluxoResumo, isLoading: isLoadingFluxo, refetch: refetchFluxo } = useAtendimentoFluxoResumo(
		atendimentoSelecionadoId ?? undefined,
	);
	const { data: notasInstrutor, isLoading: isLoadingNotas, refetch: refetchNotas } = useAtendimentoNotasInstrutor(
		atendimentoSelecionadoId ?? undefined,
	);
	const { data: avaliacoesFisio } = useAvaliacoesFisioterapiaSRED(atendimentoSelecionadoId ?? undefined);
	const { data: sessoesPEF } = useSessoesTreinoPEF(atendimentoSelecionadoId ?? undefined);
	const { data: intervencoesPsico } = useIntervencoesPsicopedagogicas(atendimentoSelecionadoId ?? undefined);
	const { data: avaliacoesNutri } = useAvaliacoesNutricionais();

	const transicaoMutation = useAtendimentoFluxoTransicao(atendimentoSelecionadoId ?? undefined);
	const createNotaMutation = useCreateAtendimentoNotaInstrutor(atendimentoSelecionadoId ?? undefined);
	const decisaoFinalMutation = useAtendimentoDecisaoFinalInstrutor(atendimentoSelecionadoId ?? undefined);

	const atendimentosFiltrados = useMemo(() => {
		const lista = atendimentos ?? [];
		const busca = filtroBusca.trim().toLowerCase();
		if (!busca) return lista;
		return lista.filter((item) =>
			[
				String(item.id),
				item.cadete_nome_guerra,
				item.cadete_nr_militar,
				item.prontidao_instrutor,
			]
				.join(' ')
				.toLowerCase()
				.includes(busca),
		);
	}, [atendimentos, filtroBusca]);

	const avaliacoesNutriAtendimento = useMemo(
		() => (avaliacoesNutri ?? []).filter((item) => item.atendimento_id === atendimentoSelecionadoId),
		[avaliacoesNutri, atendimentoSelecionadoId],
	);

	useEffect(() => {
		if (!atendimentoSelecionadoId) {
			return;
		}
		void refetchFluxo();
	}, [
		atendimentoSelecionadoId,
		avaliacoesFisio?.length,
		sessoesPEF?.length,
		intervencoesPsico?.length,
		avaliacoesNutriAtendimento.length,
		notasInstrutor?.length,
		refetchFluxo,
	]);

	const timeline = useMemo<TimelineItem[]>(() => {
		if (!atendimentoSelecionado) return [];

		const items: TimelineItem[] = [
			{
				id: `medico-${atendimentoSelecionado.id}`,
				data: atendimentoSelecionado.data_registro,
				perfil: 'Médico',
				titulo: `Atendimento ${atendimentoSelecionado.tipo_atendimento}`,
				descricao: `Diagnóstico inicial: ${atendimentoSelecionado.tipo_lesao} · ${atendimentoSelecionado.estrutura_anatomica} · S-RED ${atendimentoSelecionado.flag_sred ? 'ativo' : 'não ativo'}.`,
			},
			...(avaliacoesFisio ?? []).map((item) => ({
				id: `fisio-${item.id}`,
				data: item.data_avaliacao,
				perfil: 'Fisioterapia' as const,
				titulo: 'Avaliação e conduta fisioterapêutica',
				descricao: `EVA ${item.gravidade_eva} · Reatividade ${item.reatividade} · ${item.diagnostico_clinico || 'Sem diagnóstico informado.'}`,
			})),
			...avaliacoesNutriAtendimento.map((item) => ({
				id: `nutri-${item.id}`,
				data: item.criado_em,
				perfil: 'Nutrição' as const,
				titulo: 'Avaliação nutricional',
				descricao: `Técnica ${item.tecnica_utilizada} · % gordura ${item.percentual_gordura} · ajuste: ${item.tratamento_ajuste_nutricional || 'Não informado'}.`,
			})),
			...(sessoesPEF ?? []).map((item) => ({
				id: `pef-${item.id}`,
				data: item.criado_em,
				perfil: 'PEF' as const,
				titulo: 'Sessão de recuperação física',
				descricao: `PSE ${item.pse_paciente} · Tonelagem ${item.volume_tonelagem} · Reatividade 24h ${item.reatividade_24h}.`,
			})),
			...(intervencoesPsico ?? []).map((item) => ({
				id: `psico-${item.id}`,
				data: item.criado_em,
				perfil: 'Psicopedagogia' as const,
				titulo: 'Intervenção psicopedagógica',
				descricao: `Fadiga cognitiva ${item.indice_fadiga_cognitiva}/10 · Atenção ${item.atencao_sustentada_score}/100 · ${item.plano_progressao || 'Sem plano registrado'}.`,
			})),
			...(notasInstrutor ?? []).map((item) => ({
				id: `instrutor-${item.id}`,
				data: item.criado_em,
				perfil: 'Instrutor' as const,
				titulo: item.situacao_final ? `Decisão final: ${item.situacao_final}` : 'Nota de campo',
				descricao: item.nota_campo,
			})),
		];

		return items.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
	}, [
		atendimentoSelecionado,
		avaliacoesFisio,
		avaliacoesNutriAtendimento,
		sessoesPEF,
		intervencoesPsico,
		notasInstrutor,
	]);

	const statusPerfis = useMemo(() => {
		if (!fluxoResumo) {
			return [] as Array<{ perfil: string; pendente: boolean }>;
		}

		const concluidos = new Set<string>();
		if ((avaliacoesFisio ?? []).length > 0) concluidos.add('Fisioterapia');
		if (avaliacoesNutriAtendimento.length > 0) concluidos.add('Nutrição');
		if ((sessoesPEF ?? []).length > 0) concluidos.add('PEF');
		if ((intervencoesPsico ?? []).length > 0) concluidos.add('Psicopedagogia');
		if ((notasInstrutor ?? []).some((item) => Boolean(item.situacao_final))) concluidos.add('Instrutor');

		return fluxoResumo.perfis_obrigatorios.map((perfil) => ({
			perfil,
			pendente: !concluidos.has(perfil),
		}));
	}, [
		fluxoResumo,
		avaliacoesFisio,
		avaliacoesNutriAtendimento.length,
		sessoesPEF,
		intervencoesPsico,
		notasInstrutor,
	]);

	const progressoPercentual = useMemo(() => {
		if (statusPerfis.length === 0) return 0;
		const concluidos = statusPerfis.filter((item) => !item.pendente).length;
		return Math.round((concluidos / statusPerfis.length) * 100);
	}, [statusPerfis]);

	const pendenciasVisuais = useMemo(
		() => statusPerfis.filter((item) => item.pendente).map((item) => item.perfil),
		[statusPerfis],
	);

	const pendenciasBloqueantesDecisaoFinal = useMemo(
		() => (fluxoResumo?.pendencias ?? []).filter((perfil) => perfil !== 'Instrutor'),
		[fluxoResumo?.pendencias],
	);

	const somenteInstrutorPendente = useMemo(
		() => pendenciasVisuais.length === 1 && pendenciasVisuais[0] === 'Instrutor',
		[pendenciasVisuais],
	);

	const handleTransicao = async () => {
		if (!fluxoResumo) return;
		const proximoEstado = fluxoProximoEstado(fluxoResumo.estado_fluxo);
		if (!proximoEstado) {
			notify('Fluxo já está em estado final.', 'info');
			return;
		}

		if (proximoEstado === 'DECISAO_FINAL' && pendenciasBloqueantesDecisaoFinal.length > 0) {
			notify(
				`Existem pendências de perfis antes da decisão final: ${pendenciasBloqueantesDecisaoFinal.join(', ')}.`,
				'warning',
			);
			return;
		}

		try {
			await transicaoMutation.mutateAsync(proximoEstado);
			notify(`Fluxo atualizado para ${estadoLabel[proximoEstado]}.`, 'success');
			void refetchFluxo();
		} catch {
			notify('Não foi possível transicionar o fluxo.', 'error');
		}
	};

	const handleSalvarNotaCampo = async () => {
		if (!notaCampo.trim()) {
			notify('Informe a nota de campo antes de salvar.', 'warning');
			return;
		}
		try {
			await createNotaMutation.mutateAsync({
				nota_campo: notaCampo.trim(),
				sugestao_administrativa: sugestaoAdministrativa.trim(),
			});
			notify('Nota de campo registrada.', 'success');
			setNotaCampo('');
			setSugestaoAdministrativa('');
			void refetchNotas();
		} catch {
			notify('Falha ao registrar nota de campo.', 'error');
		}
	};

	const handleSalvarDecisaoFinal = async () => {
		if (!fluxoResumo) return;
		if (fluxoResumo.estado_fluxo !== 'DECISAO_FINAL') {
			notify('A decisão final só pode ser lançada no estado DECISAO_FINAL.', 'warning');
			return;
		}
		if (pendenciasBloqueantesDecisaoFinal.length > 0) {
			notify('Ainda há pendências de perfis obrigatórios.', 'warning');
			return;
		}
		if (!situacaoFinal) {
			notify('Selecione a situação final.', 'warning');
			return;
		}
		if (!notaCampo.trim()) {
			notify('Informe a nota de campo para fundamentar a decisão.', 'warning');
			return;
		}
		try {
			await decisaoFinalMutation.mutateAsync({
				situacao_final: situacaoFinal,
				nota_campo: notaCampo.trim(),
				sugestao_administrativa: sugestaoAdministrativa.trim(),
			});
			notify('Decisão final registrada com sucesso.', 'success');
			setNotaCampo('');
			setSugestaoAdministrativa('');
			setSituacaoFinal('');
			void refetchNotas();
			void refetchFluxo();
		} catch {
			notify('Não foi possível registrar a decisão final.', 'error');
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
				title="Falha ao carregar atendimentos"
				description="Verifique a conexão e tente novamente."
				action={<Button onClick={() => void refetch()}>Tentar novamente</Button>}
				height="45vh"
			/>
		);
	}

	if (!atendimentos || atendimentos.length === 0) {
		return (
			<EmptyState
				title="Nenhum atendimento disponível"
				description="Assim que o médico iniciar atendimentos, o painel do Instrutor ficará disponível."
				height="45vh"
			/>
		);
	}

	return (
		<Stack spacing={2}>
			<Typography variant="h5" fontWeight={700}>
				Dashboard do Instrutor
			</Typography>

			<SectionCard title="Seleção de atendimento" subtitle="Escolha o caso para acompanhar evolução e decisão final.">
				<Stack spacing={1.5}>
					<TextField
						label="Buscar atendimento"
						placeholder="ID, nº militar, nome de guerra, prontidão"
						value={filtroBusca}
						onChange={(event) => setFiltroBusca(event.target.value)}
						sx={{ maxWidth: 360, '& .MuiInputBase-root': { minHeight: 44 } }}
					/>
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
								{atendimentosFiltrados.map((item) => (
									<TableRow
										key={item.id}
										hover
										selected={item.id === atendimentoSelecionadoId}
									>
										<TableCell sx={colunaSecundariaSx}>
											{militarById.get(item.cadete_id)?.posto_graduacao || 'Aluno(a) ou Cadete'}
										</TableCell>
										<TableCell>{item.cadete_nr_militar || '—'}</TableCell>
										<TableCell>{item.cadete_nome_guerra || '—'}</TableCell>
										<TableCell>{formatDate(item.data_registro)}</TableCell>
										<TableCell>
											<Chip size="small" label={item.flag_sred ? 'Ativo' : 'Não ativo'} color={item.flag_sred ? 'warning' : 'default'} />
										</TableCell>
										<TableCell sx={colunaSecundariaSx}>{item.decisao_sred || '—'}</TableCell>
										<TableCell>
											<Button
												size="small"
												variant="outlined"
												onClick={() => navigate(`/instrutor/atendimento/${item.id}/detalhes`)}
												sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
											>
												Detalhes
											</Button>
										</TableCell>
										<TableCell>
											<Button
												size="small"
												variant="outlined"
												onClick={() => setAtendimentoSelecionadoId(item.id)}
												sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
											>
												Abrir
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TableContainer>
				</Stack>
			</SectionCard>

			{atendimentoSelecionadoId && (
				<>
					<SectionCard title="Progresso por perfil" subtitle="Acompanhamento das pendências obrigatórias do fluxo S-RED.">
						{isLoadingFluxo || !fluxoResumo ? (
							<CircularProgress size={24} />
						) : (
							<Stack spacing={1.5}>
								{atendimentoSelecionado && (
									<Typography variant="body2" color="text.secondary">
										Atendimento #{atendimentoSelecionado.id} · {atendimentoSelecionado.cadete_nome_guerra || '—'}
									</Typography>
								)}
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
									<Typography variant="body2" color="text.secondary">
										Estado atual: <strong>{estadoLabel[fluxoResumo.estado_fluxo]}</strong>
									</Typography>
									<Chip
										size="small"
										label={`Prontidão: ${fluxoResumo.prontidao_instrutor}`}
										color={prontidaoColor(fluxoResumo.prontidao_instrutor)}
										sx={resumoChipSx}
									/>
								</Stack>
								<LinearProgress variant="determinate" value={progressoPercentual} sx={{ height: 8, borderRadius: 999 }} />
								<Typography variant="body2" color="text.secondary">
									{progressoPercentual}% concluído
								</Typography>
								<Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
									{statusPerfis.map(({ perfil, pendente }) => {
										return (
											<Chip
												key={perfil}
												size="small"
												label={`${perfil} · ${pendente ? 'Pendente' : 'Concluído'}`}
												color={pendente ? 'default' : 'success'}
												variant={pendente ? 'outlined' : 'filled'}
												sx={resumoChipSx}
											/>
										);
									})}
								</Stack>
								{pendenciasVisuais.length > 0 && !somenteInstrutorPendente && (
									<Alert severity="warning">
										Pendências atuais: {pendenciasVisuais.join(', ')}
									</Alert>
								)}
								{somenteInstrutorPendente && fluxoResumo.estado_fluxo === 'ACOMPANHAMENTO' && (
									<Alert severity="info">
										Falta apenas o perfil Instrutor. Avance para Decisão Final e registre a decisão para concluir o fluxo.
									</Alert>
								)}
								<Button
									variant="contained"
									onClick={() => void handleTransicao()}
									disabled={transicaoMutation.isPending || fluxoResumo.estado_fluxo === 'DECISAO_FINAL'}
									sx={{ minHeight: 44, alignSelf: 'flex-start' }}
								>
									{fluxoResumo.estado_fluxo === 'DECISAO_FINAL'
										? 'Fluxo finalizado'
										: `Avançar para ${estadoLabel[fluxoProximoEstado(fluxoResumo.estado_fluxo) as EstadoFluxoAtendimento]}`}
								</Button>
							</Stack>
						)}
					</SectionCard>

					<SectionCard title="Timeline de eventos" subtitle="Sequência cronológica das intervenções por perfil.">
						{timeline.length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								Ainda não há eventos para este atendimento.
							</Typography>
						) : (
							<Stack spacing={1.2}>
								{timeline.map((item) => (
									<Paper key={item.id} variant="outlined" sx={{ p: 1.25 }}>
										<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
											<Stack spacing={0.4}>
												<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
													<Chip size="small" label={item.perfil} variant="outlined" />
													<Typography variant="subtitle2" fontWeight={700}>
														{item.titulo}
													</Typography>
												</Stack>
												<Typography variant="body2" color="text.secondary">
													{item.descricao}
												</Typography>
											</Stack>
											<Typography variant="caption" color="text.secondary">
												{formatDateTime(item.data)}
											</Typography>
										</Stack>
									</Paper>
								))}
							</Stack>
						)}
					</SectionCard>

					<SectionCard title="Notas de campo e decisão final" subtitle="Registro empírico do Instrutor e fechamento administrativo.">
						{isLoadingNotas ? (
							<CircularProgress size={24} />
						) : (
							<Stack spacing={1.2}>
								<TextField
									label="Nota de campo"
									multiline
									minRows={3}
									value={notaCampo}
									onChange={(event) => setNotaCampo(event.target.value)}
								/>
								<TextField
									label="Situação final"
									select
									value={situacaoFinal}
									onChange={(event) => setSituacaoFinal(event.target.value as SituacaoFinalInstrutor | '')}
								>
									<MenuItem value="">Sem decisão final</MenuItem>
									{situacaoFinalOptions.map((opt) => (
										<MenuItem key={opt} value={opt}>{opt}</MenuItem>
									))}
								</TextField>
								<TextField
									label="Sugestão administrativa"
									multiline
									minRows={2}
									value={sugestaoAdministrativa}
									onChange={(event) => setSugestaoAdministrativa(event.target.value)}
								/>
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
									<Button
										variant="outlined"
										onClick={() => void handleSalvarNotaCampo()}
										disabled={createNotaMutation.isPending}
										sx={{ minHeight: 44 }}
									>
										Salvar nota de campo
									</Button>
									<Button
										variant="contained"
										onClick={() => void handleSalvarDecisaoFinal()}
										disabled={decisaoFinalMutation.isPending}
										sx={{ minHeight: 44 }}
									>
										Registrar decisão final
									</Button>
								</Stack>
								{notasInstrutor && notasInstrutor.length > 0 && (
									<Stack spacing={1} pt={1}>
										<Typography variant="subtitle2" fontWeight={700}>
											Histórico do Instrutor
										</Typography>
										{notasInstrutor.map((nota) => (
											<Paper key={nota.id} variant="outlined" sx={{ p: 1 }}>
												<Stack spacing={0.4}>
													<Typography variant="caption" color="text.secondary">
														{formatDateTime(nota.criado_em)} · {nota.instrutor_username}
													</Typography>
													{nota.situacao_final && (
														<Chip size="small" label={nota.situacao_final} color="primary" sx={{ width: 'fit-content' }} />
													)}
													<Typography variant="body2">{nota.nota_campo}</Typography>
													{nota.sugestao_administrativa && (
														<Typography variant="body2" color="text.secondary">
															Sugestão: {nota.sugestao_administrativa}
														</Typography>
													)}
												</Stack>
											</Paper>
										))}
									</Stack>
								)}
							</Stack>
						)}
					</SectionCard>
				</>
			)}
		</Stack>
	);
};

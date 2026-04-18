import { useMemo } from 'react';

import {
	Button,
	Chip,
	CircularProgress,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';

import { EmptyState, SectionCard } from '../design-system';
import {
	useAtendimentoNotasInstrutor,
	useAtendimentos,
	useAvaliacoesFisioterapiaSRED,
} from '../hooks/useAtendimentos';
import { useSessoesTreinoPEF } from '../hooks/useEducacaoFisica';
import { useAvaliacoesNutricionais } from '../hooks/useNutricao';
import { useMilitares } from '../hooks/usePessoal';
import { useIntervencoesPsicopedagogicas } from '../hooks/usePsicopedagogia';

interface EspecialidadeAtendimentoDetalhesPageProps {
	modulo: 'fisioterapia' | 'educador-fisico' | 'nutricao' | 'psicopedagogia' | 'instrutor';
}

const moduloTitulo: Record<EspecialidadeAtendimentoDetalhesPageProps['modulo'], string> = {
	fisioterapia: 'Fisioterapia',
	'educador-fisico': 'Profissional de Educação Física',
	nutricao: 'Nutrição',
	psicopedagogia: 'Psicopedagogia',
	instrutor: 'Instrutor',
};

const formatDateTime = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
};

const tableDetalhesSx = { minWidth: 640, '& th': { whiteSpace: 'nowrap' } };
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

export const EspecialidadeAtendimentoDetalhesPage = ({
	modulo,
}: EspecialidadeAtendimentoDetalhesPageProps) => {
	const navigate = useNavigate();
	const { atendimentoId } = useParams<{ atendimentoId: string }>();
	const atendimentoIdNum = Number(atendimentoId);

	const { data: atendimentos, isLoading, isError, refetch } = useAtendimentos();
	const { data: militares } = useMilitares();
	const { data: avaliacoesFisio } = useAvaliacoesFisioterapiaSRED(
		Number.isFinite(atendimentoIdNum) ? atendimentoIdNum : undefined,
	);
	const { data: sessoesPEF } = useSessoesTreinoPEF(
		Number.isFinite(atendimentoIdNum) ? atendimentoIdNum : undefined,
	);
	const { data: avaliacoesNutri } = useAvaliacoesNutricionais();
	const { data: intervencoesPsico } = useIntervencoesPsicopedagogicas(
		Number.isFinite(atendimentoIdNum) ? atendimentoIdNum : undefined,
	);
	const { data: notasInstrutor } = useAtendimentoNotasInstrutor(
		Number.isFinite(atendimentoIdNum) ? atendimentoIdNum : undefined,
	);

	const atendimento = useMemo(
		() => atendimentos?.find((item) => item.id === atendimentoIdNum) ?? null,
		[atendimentos, atendimentoIdNum],
	);

	const militar = useMemo(
		() => militares?.find((item) => item.id === atendimento?.cadete_id) ?? null,
		[militares, atendimento],
	);

	const avaliacoesNutriAtendimento = useMemo(
		() => (avaliacoesNutri ?? []).filter((item) => item.atendimento_id === atendimentoIdNum),
		[avaliacoesNutri, atendimentoIdNum],
	);

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
				title="Falha ao carregar atendimento"
				description="Verifique a conexão e tente novamente."
				action={<Button onClick={() => void refetch()}>Tentar novamente</Button>}
				height="45vh"
			/>
		);
	}

	if (!atendimento) {
		return (
			<EmptyState
				title="Atendimento não encontrado"
				description="O registro pode ter sido removido ou não estar acessível para o seu perfil."
				action={
					<Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
						Voltar
					</Button>
				}
				height="45vh"
			/>
		);
	}

	return (
		<Stack spacing={2}>
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
				<Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ alignSelf: 'flex-start' }}>
					Voltar
				</Button>
				<Typography variant="h5" fontWeight={700}>
					Detalhes — {moduloTitulo[modulo]}
				</Typography>
			</Stack>

			<SectionCard title="Resumo do Atendimento">
				<Stack direction={{ xs: 'column', md: 'row' }} spacing={1} useFlexGap flexWrap="wrap">
					<Chip label={`Atendimento #${atendimento.id}`} size="small" sx={resumoChipSx} />
					<Chip label={`Data: ${formatDateTime(atendimento.data_registro)}`} variant="outlined" size="small" sx={resumoChipSx} />
					<Chip label={`Posto/Grad: ${militar?.posto_graduacao || 'Aluno(a) ou Cadete'}`} variant="outlined" size="small" sx={resumoChipSx} />
					<Chip label={`Nr: ${atendimento.cadete_nr_militar || '—'}`} variant="outlined" size="small" sx={resumoChipSx} />
					<Chip label={`Nome de Guerra: ${atendimento.cadete_nome_guerra || '—'}`} variant="outlined" size="small" sx={resumoChipSx} />
					<Chip
						label={`S-RED: ${atendimento.flag_sred ? 'Ativo' : 'Não ativo'}`}
						color={atendimento.flag_sred ? 'warning' : 'default'}
						size="small"
						sx={resumoChipSx}
					/>
					<Chip label={`Decisão S-RED: ${atendimento.decisao_sred || '—'}`} variant="outlined" size="small" sx={resumoChipSx} />
				</Stack>
			</SectionCard>

			{modulo === 'fisioterapia' && (
				<SectionCard title="Ficha Fisio — Registros">
					{(avaliacoesFisio ?? []).length === 0 ? (
						<Typography variant="body2" color="text.secondary">Sem registros para este atendimento.</Typography>
					) : (
						<TableContainer sx={{ overflowX: 'auto' }}>
							<Table size="small" sx={tableDetalhesSx}>
								<TableHead>
									<TableRow>
										<TableCell>Data</TableCell>
										<TableCell>EVA</TableCell>
										<TableCell>Reatividade</TableCell>
										<TableCell sx={colunaSecundariaSx}>Diagnóstico</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(avaliacoesFisio ?? []).map((item) => (
										<TableRow key={item.id}>
											<TableCell>{formatDateTime(item.data_avaliacao)}</TableCell>
											<TableCell>{item.gravidade_eva}</TableCell>
											<TableCell>{item.reatividade}</TableCell>
											<TableCell sx={colunaSecundariaSx}>{item.diagnostico_clinico || '—'}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</SectionCard>
			)}

			{modulo === 'educador-fisico' && (
				<SectionCard title="Ação — Sessões do Profissional de Educação Física">
					{(sessoesPEF ?? []).length === 0 ? (
						<Typography variant="body2" color="text.secondary">Sem sessões registradas para este atendimento.</Typography>
					) : (
						<TableContainer sx={{ overflowX: 'auto' }}>
							<Table size="small" sx={tableDetalhesSx}>
								<TableHead>
									<TableRow>
										<TableCell>Data</TableCell>
										<TableCell>PSE</TableCell>
										<TableCell>Tonelagem</TableCell>
										<TableCell sx={colunaSecundariaSx}>Reatividade 24h</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(sessoesPEF ?? []).map((item) => (
										<TableRow key={item.id}>
											<TableCell>{formatDateTime(item.criado_em)}</TableCell>
											<TableCell>{item.pse_paciente}</TableCell>
											<TableCell>{item.volume_tonelagem}</TableCell>
											<TableCell sx={colunaSecundariaSx}>{item.reatividade_24h}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</SectionCard>
			)}

			{modulo === 'nutricao' && (
				<SectionCard title="Ação — Avaliações Nutricionais">
					{avaliacoesNutriAtendimento.length === 0 ? (
						<Typography variant="body2" color="text.secondary">Sem avaliações nutricionais para este atendimento.</Typography>
					) : (
						<TableContainer sx={{ overflowX: 'auto' }}>
							<Table size="small" sx={tableDetalhesSx}>
								<TableHead>
									<TableRow>
										<TableCell>Data</TableCell>
										<TableCell>% Gordura</TableCell>
										<TableCell>Técnica</TableCell>
										<TableCell sx={colunaSecundariaSx}>Ingestão Ideal (ml)</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{avaliacoesNutriAtendimento.map((item) => (
										<TableRow key={item.id}>
											<TableCell>{formatDateTime(item.criado_em)}</TableCell>
											<TableCell>{item.percentual_gordura}</TableCell>
											<TableCell>{item.tecnica_utilizada}</TableCell>
											<TableCell sx={colunaSecundariaSx}>{item.ingestao_liquida_ideal_ml}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</SectionCard>
			)}

			{modulo === 'psicopedagogia' && (
				<SectionCard title="Histórico Psicopedagógico">
					{(intervencoesPsico ?? []).length === 0 ? (
						<Typography variant="body2" color="text.secondary">Sem intervenções para este atendimento.</Typography>
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
									{(intervencoesPsico ?? []).map((item) => (
										<TableRow key={item.id}>
											<TableCell>{formatDateTime(item.criado_em)}</TableCell>
											<TableCell>
												{item.data_atendimento
													? new Date(item.data_atendimento).toLocaleDateString('pt-BR')
													: '—'}
											</TableCell>
											<TableCell sx={colunaSecundariaSx}>{item.motivo_atendimento || '—'}</TableCell>
											<TableCell sx={{ maxWidth: 240 }}>
												{item.encaminhamentos_realizados
													? item.encaminhamentos_realizados.length > 80
														? `${item.encaminhamentos_realizados.slice(0, 80)}…`
														: item.encaminhamentos_realizados
													: '—'}
											</TableCell>
											<TableCell sx={{ maxWidth: 240, ...colunaSecundariaSx }}>
												{item.observacoes
													? item.observacoes.length > 80
														? `${item.observacoes.slice(0, 80)}…`
														: item.observacoes
													: '—'}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</SectionCard>
			)}

			{modulo === 'instrutor' && (
				<SectionCard title="Ação — Notas e Decisão do Instrutor">
					{(notasInstrutor ?? []).length === 0 ? (
						<Typography variant="body2" color="text.secondary">Sem registros do Instrutor para este atendimento.</Typography>
					) : (
						<TableContainer sx={{ overflowX: 'auto' }}>
							<Table size="small" sx={tableDetalhesSx}>
								<TableHead>
									<TableRow>
										<TableCell>Data</TableCell>
										<TableCell>Nota de Campo</TableCell>
										<TableCell sx={colunaSecundariaSx}>Situação Final</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{(notasInstrutor ?? []).map((item) => (
										<TableRow key={item.id}>
											<TableCell>{formatDateTime(item.criado_em)}</TableCell>
											<TableCell>{item.nota_campo}</TableCell>
											<TableCell sx={colunaSecundariaSx}>{item.situacao_final || '—'}</TableCell>
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

import { useMemo } from 'react';

import {
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';

import { EmptyState, SectionCard } from '../design-system';
import { useAtendimentos } from '../hooks/useAtendimentos';
import type { Atendimento, DecisaoSred } from '../types/atendimento';

const formatData = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
};

const boolLabel = (v: boolean) => (v ? 'Sim' : 'Não');

const listLabel = (v: string[]): string =>
	v && v.length > 0 ? v.join(', ') : '—';

const strLabel = (v: string | undefined | null): string =>
	v?.trim() || '—';

const decisaoSredColor = (
	decisao: DecisaoSred | '',
): 'error' | 'success' | 'default' => {
	if (decisao === 'S-RED Positivo') return 'error';
	if (decisao === 'S-RED Negativo') return 'success';
	return 'default';
};

interface InfoRowProps {
	label: string;
	value: string | React.ReactNode;
}

const InfoRow = ({ label, value }: InfoRowProps) => (
	<TableRow>
		<TableCell
			component="th"
			scope="row"
			sx={{ width: '40%', fontWeight: 600, color: 'text.secondary', borderBottom: 'none', py: 0.75 }}
		>
			{label}
		</TableCell>
		<TableCell sx={{ borderBottom: 'none', py: 0.75 }}>{value}</TableCell>
	</TableRow>
);

interface AtendimentoCardProps {
	atendimento: Atendimento;
	numero: number;
}

const AtendimentoCard = ({ atendimento: atd, numero }: AtendimentoCardProps) => {
	const isRetorno = atd.tipo_atendimento === 'Retorno';

	return (
		<SectionCard
			title={`Atendimento ${numero} — ${atd.tipo_atendimento}`}
			subtitle={`ID ${atd.id} · ${formatData(atd.data_registro)}${isRetorno && atd.atendimento_origem_id ? ` · Retorno do atd. #${atd.atendimento_origem_id}` : ''}`}
		>
			<Stack spacing={2}>
				{/* Lesão */}
				<Box>
					<Typography variant="subtitle2" fontWeight={700} mb={0.5}>
						Lesão
					</Typography>
					<TableContainer>
						<Table size="small">
							<TableBody>
								<InfoRow label="Tipo de Lesão" value={strLabel(atd.tipo_lesao)} />
								<InfoRow label="Origem" value={strLabel(atd.origem_lesao)} />
								<InfoRow label="Segmento Corporal" value={strLabel(atd.segmento_corporal)} />
								<InfoRow label="Estrutura Anatômica" value={strLabel(atd.estrutura_anatomica)} />
								<InfoRow label="Localização" value={strLabel(atd.localizacao_lesao)} />
								<InfoRow label="Lateralidade" value={strLabel(atd.lateralidade)} />
							</TableBody>
						</Table>
					</TableContainer>
				</Box>

				<Divider />

				{/* Atividade */}
				<Box>
					<Typography variant="subtitle2" fontWeight={700} mb={0.5}>
						Atividade
					</Typography>
					<TableContainer>
						<Table size="small">
							<TableBody>
								<InfoRow label="Classificação" value={strLabel(atd.classificacao_atividade)} />
								<InfoRow label="Tipo de Atividade" value={strLabel(atd.tipo_atividade)} />
								<InfoRow label="TFM/TAF" value={strLabel(atd.tfm_taf)} />
								<InfoRow label="Modalidade Esportiva" value={strLabel(atd.modalidade_esportiva)} />
							</TableBody>
						</Table>
					</TableContainer>
				</Box>

				<Divider />

				{/* Conduta e S-RED */}
				<Box>
					<Typography variant="subtitle2" fontWeight={700} mb={0.5}>
						Conduta e S-RED
					</Typography>
					<TableContainer>
						<Table size="small">
							<TableBody>
								<InfoRow label="Conduta Terapêutica" value={strLabel(atd.conduta_terapeutica)} />
								<InfoRow
									label="S-RED"
									value={
										<Chip
											size="small"
											variant={atd.flag_sred ? 'filled' : 'outlined'}
											color={atd.flag_sred ? 'warning' : 'default'}
											label={atd.flag_sred ? 'Sim' : 'Não'}
										/>
									}
								/>
								<InfoRow
									label="Decisão S-RED"
									value={
										<Chip
											size="small"
											variant={atd.decisao_sred ? 'filled' : 'outlined'}
											color={decisaoSredColor(atd.decisao_sred)}
											label={atd.decisao_sred || 'Não aplicável'}
										/>
									}
								/>
								<InfoRow label="Medicamentoso" value={boolLabel(atd.medicamentoso)} />
								<InfoRow
									label="Exames Complementares"
									value={
										atd.solicitar_exames_complementares
											? listLabel(atd.exames_complementares)
											: 'Não solicitado'
									}
								/>
							</TableBody>
						</Table>
					</TableContainer>
				</Box>

				<Divider />

				{/* Encaminhamentos e Disposição */}
				<Box>
					<Typography variant="subtitle2" fontWeight={700} mb={0.5}>
						Encaminhamentos e Disposição
					</Typography>
					<TableContainer>
						<Table size="small">
							<TableBody>
								<InfoRow
									label="Encaminhamentos"
									value={listLabel(atd.encaminhamentos_multidisciplinares)}
								/>
								<InfoRow label="Disposição do Cadete" value={listLabel(atd.disposicao_cadete)} />
							</TableBody>
						</Table>
					</TableContainer>
				</Box>

				{atd.notas_clinicas && (
					<>
						<Divider />
						<Box>
							<Typography variant="subtitle2" fontWeight={700} mb={0.5}>
								Notas Clínicas
							</Typography>
							<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
								{atd.notas_clinicas}
							</Typography>
						</Box>
					</>
				)}
			</Stack>
		</SectionCard>
	);
};

export const MedicoAtendimentoDetalhesPage = () => {
	const { cadeteId } = useParams<{ cadeteId: string }>();
	const navigate = useNavigate();
	const { data, isLoading, isError, refetch } = useAtendimentos();

	const cadeteIdNum = cadeteId ? Number(cadeteId) : NaN;

	const atendimentos = useMemo<Atendimento[]>(() => {
		if (!data || Number.isNaN(cadeteIdNum)) return [];
		return data
			.filter((a) => a.cadete_id === cadeteIdNum)
			.sort(
				(a, b) =>
					new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime(),
			);
	}, [data, cadeteIdNum]);

	const paciente = atendimentos[0];

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
				action={
					<Button variant="contained" onClick={() => void refetch()} sx={{ minHeight: 44 }}>
						Tentar novamente
					</Button>
				}
				height="45vh"
			/>
		);
	}

	if (Number.isNaN(cadeteIdNum) || (!isLoading && atendimentos.length === 0)) {
		return (
			<EmptyState
				title="Nenhum atendimento encontrado"
				description="Este paciente não possui atendimentos registrados."
				action={
					<Button
						startIcon={<ArrowBackIcon />}
						onClick={() => navigate('/dashboard/reabilita/medico')}
						sx={{ minHeight: 44 }}
					>
						Voltar
					</Button>
				}
				height="45vh"
			/>
		);
	}

	const iniciais = atendimentos.filter((a) => a.tipo_atendimento === 'Inicial');
	const retornos = atendimentos.filter((a) => a.tipo_atendimento === 'Retorno');

	return (
		<Stack spacing={3}>
			{/* Cabeçalho do paciente */}
			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={() => navigate('/dashboard/reabilita/medico')}
					sx={{ minHeight: 44, alignSelf: 'flex-start' }}
				>
					Voltar
				</Button>
				<Box>
					<Typography variant="h5" fontWeight={700}>
						Resumo do Paciente
					</Typography>
					{paciente && (
						<Typography variant="body2" color="text.secondary">
							Nº {paciente.cadete_nr_militar || '—'} · {paciente.cadete_nome_guerra || '—'} ·{' '}
							{atendimentos.length} atendimento(s)
						</Typography>
					)}
				</Box>
			</Stack>

			{/* Atendimentos iniciais */}
			{iniciais.length > 0 && (
				<>
					<Typography variant="h6" fontWeight={600}>
						Atendimentos Iniciais ({iniciais.length})
					</Typography>
					{iniciais.map((atd, idx) => (
						<AtendimentoCard key={atd.id} atendimento={atd} numero={idx + 1} />
					))}
				</>
			)}

			{/* Atendimentos de retorno */}
			{retornos.length > 0 && (
				<>
					<Typography variant="h6" fontWeight={600}>
						Atendimentos de Retorno ({retornos.length})
					</Typography>
					{retornos.map((atd, idx) => (
						<AtendimentoCard key={atd.id} atendimento={atd} numero={idx + 1} />
					))}
				</>
			)}
		</Stack>
	);
};

import { useMemo, useState } from 'react';

import {
	Button,
	Chip,
	CircularProgress,
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
import { useNavigate } from 'react-router-dom';

import { FilterActionsRow } from '../components/common';
import { EmptyState, SectionCard } from '../design-system';
import { useAtendimentos } from '../hooks/useAtendimentos';
import { useMilitares } from '../hooks/usePessoal';
import type { Atendimento, TipoLesao } from '../types/atendimento';

const formatDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('pt-BR');
};

const tipoLesaoOptions: TipoLesao[] = [
	'Óssea',
	'Articular',
	'Muscular',
	'Tendinosa',
	'Neurológica',
];

const normalizeEncaminhamento = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();

const ENCAMINHAMENTO_FISIOTERAPIA_ALIASES = new Set([
	'fisioterapia',
	'fisioterapeuta',
	'fisioterapeutico',
	'fisioterapeutica',
]);

const colunaSecundariaSx = { display: { xs: 'none', sm: 'table-cell' } };

const isEncaminhadoParaFisioterapia = (atendimento: Atendimento): boolean => {
	const encaminhamentos = atendimento.encaminhamentos_multidisciplinares ?? [];
	return encaminhamentos.some((item) => ENCAMINHAMENTO_FISIOTERAPIA_ALIASES.has(normalizeEncaminhamento(item)));
};

export const FisioterapeutaPage = () => {
	const { data, isLoading, isError, refetch } = useAtendimentos();
	const { data: militares } = useMilitares();
	const navigate = useNavigate();
	const [busca, setBusca] = useState('');
	const [tipoLesaoFiltro, setTipoLesaoFiltro] = useState<TipoLesao | ''>('');

	const militarById = useMemo(() => {
		const map = new Map<number, { posto_graduacao: string }>();
		for (const item of militares ?? []) {
			map.set(item.id, { posto_graduacao: item.posto_graduacao });
		}
		return map;
	}, [militares]);

	const atendimentos = useMemo(() => {
		const lista = (data ?? []).filter(isEncaminhadoParaFisioterapia);
		const buscaNorm = busca.trim().toLowerCase();

		return lista.filter((item) => {
			if (tipoLesaoFiltro && item.tipo_lesao !== tipoLesaoFiltro) return false;

			if (buscaNorm) {
				const texto = [
					item.estrutura_anatomica,
					item.localizacao_lesao,
					item.lateralidade,
					item.notas_clinicas,
				]
					.join(' ')
					.toLowerCase();
				if (!texto.includes(buscaNorm)) return false;
			}
			return true;
		});
	}, [data, busca, tipoLesaoFiltro]);

	if (isLoading) {
		return (
			<Stack alignItems="center" justifyContent="center" py={8}>
				<CircularProgress />
			</Stack>
		);
	}

	if (isError) {
		return (
			<SectionCard title="Fisioterapia — Reabilitação">
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
				Módulo Fisioterapia — Correção de Assimetrias e Instabilidades
			</Typography>

			<SectionCard title="Filtros">
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
					<TextField
						label="Buscar"
						placeholder="Estrutura, localização, notas…"
						size="small"
						value={busca}
						onChange={(e) => setBusca(e.target.value)}
						sx={{ minWidth: 220 }}
					/>
					<TextField
						label="Tipo de Lesão"
						select
						size="small"
						value={tipoLesaoFiltro}
						onChange={(e) => setTipoLesaoFiltro(e.target.value as TipoLesao | '')}
						sx={{ minWidth: 160 }}
					>
						<MenuItem value="">Todos</MenuItem>
						{tipoLesaoOptions.map((opt) => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</TextField>
				</Stack>
				<FilterActionsRow
					refreshLabel="Atualizar"
					onRefresh={() => { refetch(); }}
					onClear={() => {
						setBusca('');
						setTipoLesaoFiltro('');
					}}
				/>
			</SectionCard>

			<SectionCard title="Atendimentos — Fisioterapia">
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
									<TableCell>Atendimento</TableCell>
									<TableCell sx={colunaSecundariaSx}>Posto/Grad</TableCell>
									<TableCell>Nr</TableCell>
									<TableCell>Nome de Guerra</TableCell>
									<TableCell>Data</TableCell>
									<TableCell>S-RED</TableCell>
									<TableCell sx={colunaSecundariaSx}>Decisão S-RED</TableCell>
									<TableCell>Detalhes</TableCell>
									<TableCell>Ficha Fisio</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{atendimentos.map((atd) => (
									<TableRow key={atd.id}>
										<TableCell>#{atd.id}</TableCell>
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
										<TableCell sx={colunaSecundariaSx}>
											{atd.flag_sred ? 'S-RED Positivo' : atd.decisao_sred || '—'}
										</TableCell>
										<TableCell>
											<Button
												size="small"
												variant="outlined"
												onClick={() => navigate(`/fisioterapia/atendimento/${atd.id}/detalhes`)}
												sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
											>
												Detalhes
											</Button>
										</TableCell>
										<TableCell>
											<Button
												size="small"
												variant="outlined"
												onClick={() => navigate(`/fisioterapia/avaliacao-sred/${atd.id}`)}
												sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
											>
												Ficha Fisio
											</Button>
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

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
	TableSortLabel,
	TextField,
	Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { FilterActionsRow, PaginationControlsRow } from '../components/common';
import { EmptyState, SectionCard } from '../design-system';
import { useAtendimentos } from '../hooks/useAtendimentos';
import { useMilitares } from '../hooks/usePessoal';
import { usePaginationControls } from '../hooks/usePaginationControls';
import type { DecisaoSred } from '../types/atendimento';

type MedicoOrderBy = 'data_registro' | 'id' | 'decisao_sred';
type MedicoOrderDir = 'asc' | 'desc';
type SredFiltro = '' | 'sim' | 'nao';

const pageSizeOptions = [10, 20, 50, 100];

const defaultOrderDirectionByField: Record<MedicoOrderBy, MedicoOrderDir> = {
	data_registro: 'desc',
	id: 'desc',
	decisao_sred: 'asc',
};

const formatDataRegistro = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	})}`;
};

const decisaoSredColor = (
	decisao: DecisaoSred | '',
): 'error' | 'success' | 'default' => {
	if (decisao === 'S-RED Positivo') return 'error';
	if (decisao === 'S-RED Negativo') return 'success';
	return 'default';
};

export const MedicoPage = () => {
	const { data, isLoading, isError, refetch } = useAtendimentos();
	const { data: militares } = useMilitares();
	const navigate = useNavigate();

	const [busca, setBusca] = useState('');
	const [sredFiltro, setSredFiltro] = useState<SredFiltro>('');
	const [sexoFiltro, setSexoFiltro] = useState('');
	const [dataInicio, setDataInicio] = useState('');
	const [dataFim, setDataFim] = useState('');
	const [ordenarPor, setOrdenarPor] = useState<MedicoOrderBy>('data_registro');
	const [direcao, setDirecao] = useState<MedicoOrderDir>('desc');
	const [paginaAtual, setPaginaAtual] = useState(1);
	const [tamanhoPagina, setTamanhoPagina] = useState(20);

	const postoById = useMemo(() => {
		const map = new Map<number, string>();
		for (const item of militares ?? []) {
			map.set(item.id, item.posto_graduacao);
		}
		return map;
	}, [militares]);

	const sexoById = useMemo(() => {
		const map = new Map<number, string>();
		for (const item of militares ?? []) {
			map.set(item.id, item.sexo);
		}
		return map;
	}, [militares]);

	const sexoOpcoes = useMemo(
		() => Array.from(new Set((militares ?? []).map((item) => item.sexo).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[militares],
	);

	const filteredItems = useMemo(() => {
		if (!data) return [];

		const buscaNorm = busca.trim().toLowerCase();
		const inicioTs = dataInicio ? new Date(`${dataInicio}T00:00:00`).getTime() : null;
		const fimTs = dataFim ? new Date(`${dataFim}T23:59:59`).getTime() : null;

		return data.filter((item) => {
			if (sredFiltro === 'sim' && !item.flag_sred) return false;
			if (sredFiltro === 'nao' && item.flag_sred) return false;

			const sexoPaciente = sexoById.get(item.cadete_id) || '';
			if (sexoFiltro && sexoPaciente !== sexoFiltro) return false;

			if (buscaNorm) {
				const texto = [item.cadete_nr_militar, item.cadete_nome_guerra, sexoPaciente]
					.join(' ')
					.toLowerCase();
				if (!texto.includes(buscaNorm)) return false;
			}

			if (inicioTs !== null || fimTs !== null) {
				const ts = new Date(item.data_registro).getTime();
				if (Number.isNaN(ts)) return false;
				if (inicioTs !== null && ts < inicioTs) return false;
				if (fimTs !== null && ts > fimTs) return false;
			}

			return true;
		});
	}, [data, busca, sredFiltro, sexoFiltro, dataInicio, dataFim, sexoById]);

	const sortedItems = useMemo(() => {
		const items = [...filteredItems];
		items.sort((a, b) => {
			let cmp = 0;
			if (ordenarPor === 'id') {
				cmp = a.id - b.id;
			} else if (ordenarPor === 'decisao_sred') {
				const rank = (v: string) =>
					v === 'S-RED Positivo' ? 2 : v === 'S-RED Negativo' ? 1 : 0;
				cmp = rank(a.decisao_sred) - rank(b.decisao_sred);
			} else {
				cmp = new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime();
			}
			return direcao === 'asc' ? cmp : -cmp;
		});
		return items;
	}, [filteredItems, ordenarPor, direcao]);

	const totalItens = sortedItems.length;
	const totalPaginas = totalItens > 0 ? Math.ceil(totalItens / tamanhoPagina) : 0;

	const {
		pageInput,
		setPageInput,
		effectivePage,
		canGoPrevious,
		canGoNext,
		goPrevious,
		goNext,
		goToInputPage,
	} = usePaginationControls({
		currentPage: paginaAtual,
		totalPages: totalPaginas,
		setCurrentPage: setPaginaAtual,
		isReady: !isLoading,
	});

	const paginatedItems = useMemo(() => {
		const offset = (effectivePage - 1) * tamanhoPagina;
		return sortedItems.slice(offset, offset + tamanhoPagina);
	}, [sortedItems, effectivePage, tamanhoPagina]);

	const handleOrdenacao = (campo: MedicoOrderBy) => {
		setPaginaAtual(1);
		if (ordenarPor === campo) {
			setDirecao((cur) => (cur === 'asc' ? 'desc' : 'asc'));
			return;
		}
		setOrdenarPor(campo);
		setDirecao(defaultOrderDirectionByField[campo]);
	};

	const handleLimpar = () => {
		setBusca('');
		setSredFiltro('');
		setSexoFiltro('');
		setDataInicio('');
		setDataFim('');
		setPaginaAtual(1);
		setTamanhoPagina(20);
		setOrdenarPor('data_registro');
		setDirecao('desc');
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
				action={
					<Button variant="contained" onClick={() => void refetch()} sx={{ minHeight: 44, minWidth: 44 }}>
						Tentar novamente
					</Button>
				}
				height="45vh"
			/>
		);
	}

	if (!data || data.length === 0) {
		return (
			<EmptyState
				title="Nenhum atendimento cadastrado"
				description="A estrutura inicial está pronta para começar os primeiros registros clínicos."
				height="45vh"
			/>
		);
	}

	return (
		<Stack spacing={2}>
			<Typography variant="h5">Módulo de Atendimentos</Typography>

			<SectionCard title="Filtros" subtitle="Busca por número ou nome de guerra, sexo, período e S-RED.">
				<Stack spacing={1.5}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} flexWrap="wrap">
						<TextField
							label="Buscar (nº ou nome de guerra)"
							value={busca}
							onChange={(e) => { setBusca(e.target.value); setPaginaAtual(1); }}
							sx={{ minWidth: { xs: '100%', sm: 240 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							select
							label="S-RED"
							value={sredFiltro}
							onChange={(e) => { setSredFiltro(e.target.value as SredFiltro); setPaginaAtual(1); }}
							sx={{ minWidth: { xs: '100%', sm: 160 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							<MenuItem value="sim">Somente S-RED</MenuItem>
							<MenuItem value="nao">Sem S-RED</MenuItem>
						</TextField>
						<TextField
							select
							label="Sexo"
							value={sexoFiltro}
							onChange={(e) => { setSexoFiltro(e.target.value); setPaginaAtual(1); }}
							sx={{ minWidth: { xs: '100%', sm: 160 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{sexoOpcoes.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>
						<TextField
							label="Data início"
							type="date"
							value={dataInicio}
							onChange={(e) => { setDataInicio(e.target.value); setPaginaAtual(1); }}
							InputLabelProps={{ shrink: true }}
							sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							label="Data fim"
							type="date"
							value={dataFim}
							onChange={(e) => { setDataFim(e.target.value); setPaginaAtual(1); }}
							InputLabelProps={{ shrink: true }}
							sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							select
							label="Itens por página"
							value={String(tamanhoPagina)}
							onChange={(e) => { setTamanhoPagina(Number(e.target.value)); setPaginaAtual(1); }}
							sx={{ minWidth: { xs: '100%', sm: 160 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							{pageSizeOptions.map((s) => (
								<MenuItem key={s} value={String(s)}>{s}</MenuItem>
							))}
						</TextField>
					</Stack>

					<FilterActionsRow
						refreshLabel="Atualizar lista"
						onRefresh={() => void refetch()}
						refreshDisabled={isLoading}
						onClear={handleLimpar}
					/>
				</Stack>
			</SectionCard>

			{paginatedItems.length === 0 ? (
				<EmptyState
					title="Nenhum atendimento encontrado"
					description="Ajuste os filtros para localizar registros clínicos."
					height="30vh"
				/>
			) : (
				<>
					<Typography variant="body2" color="text.secondary">
						Total: {totalItens} registro(s) · Página {effectivePage} de {totalPaginas}
					</Typography>

					<SectionCard title="Atendimentos">
						<TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
							<Table size="small" sx={{ minWidth: 980, '& th': { whiteSpace: 'nowrap' } }}>
								<TableHead>
									<TableRow>
										<TableCell>Posto/Grad</TableCell>
										<TableCell>Nr</TableCell>
										<TableCell>Nome de Guerra</TableCell>
										<TableCell>Sexo</TableCell>
										<TableCell sortDirection={ordenarPor === 'data_registro' ? direcao : false}>
											<TableSortLabel
												active={ordenarPor === 'data_registro'}
												direction={ordenarPor === 'data_registro' ? direcao : 'asc'}
												onClick={() => handleOrdenacao('data_registro')}
											>
												Data
											</TableSortLabel>
										</TableCell>
										<TableCell>S-RED</TableCell>
										<TableCell sortDirection={ordenarPor === 'decisao_sred' ? direcao : false}>
											<TableSortLabel
												active={ordenarPor === 'decisao_sred'}
												direction={ordenarPor === 'decisao_sred' ? direcao : 'asc'}
												onClick={() => handleOrdenacao('decisao_sred')}
											>
												Decisão S-RED
											</TableSortLabel>
										</TableCell>
										<TableCell>Detalhes</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{paginatedItems.map((item) => (
										<TableRow key={item.id}>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>{postoById.get(item.cadete_id) || 'Aluno(a) ou Cadete'}</TableCell>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>
												{item.cadete_nr_militar || '—'}
											</TableCell>
											<TableCell sx={{ minWidth: 160 }}>
												{item.cadete_nome_guerra || '—'}
											</TableCell>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>
												{sexoById.get(item.cadete_id) || '—'}
											</TableCell>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>
												{formatDataRegistro(item.data_registro)}
											</TableCell>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>
												<Chip
													size="small"
													variant={item.flag_sred ? 'filled' : 'outlined'}
													color={item.flag_sred ? 'warning' : 'default'}
													label={item.flag_sred ? 'Sim' : 'Não'}
												/>
											</TableCell>
											<TableCell sx={{ whiteSpace: 'nowrap' }}>
												<Chip
													size="small"
													variant={item.decisao_sred ? 'filled' : 'outlined'}
													color={decisaoSredColor(item.decisao_sred)}
													label={item.decisao_sred || 'Não aplicável'}
												/>
											</TableCell>
											<TableCell>
												<Button
													size="small"
													variant="outlined"
													onClick={() =>
														navigate(`/medico/paciente/${item.cadete_id}`)
													}
													sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
												>
													Detalhes
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</SectionCard>

					<PaginationControlsRow
						canGoPrevious={canGoPrevious}
						canGoNext={canGoNext}
						onGoPrevious={goPrevious}
						onGoNext={goNext}
						pageInput={pageInput}
						onPageInputChange={setPageInput}
						onGoToPage={goToInputPage}
					/>
				</>
			)}
		</Stack>
	);
};

import { useMemo, useState } from 'react';

import {
	Button,
	CircularProgress,
	MenuItem,
	Stack,
	TextField,
	Typography,
} from '@mui/material';

import { FilterActionsRow, PaginationControlsRow } from '../components/common';
import { EmptyState, SectionCard } from '../design-system';
import { useAtendimentos } from '../hooks/useAtendimentos';
import { usePaginationControls } from '../hooks/usePaginationControls';
import {
	readDateParam,
	readEnumParam,
	readPositiveIntParam,
	readStringParam,
	useInitialUrlQueryState,
	useSyncUrlQueryState,
	writeOptionalParam,
	writeOptionalTrimmedParam,
	writeRequiredParam,
} from '../hooks/useUrlQueryState';
import { AtendimentoList } from '../components/atendimento/AtendimentoList';
import type { TipoLesao } from '../types/atendimento';

type AtendimentosOrderBy = 'data_registro' | 'id' | 'decisao_sred';
type AtendimentosOrderDir = 'asc' | 'desc';
type SredFiltro = '' | 'sim' | 'nao';

const tipoLesaoOptions: TipoLesao[] = [
	'Óssea',
	'Articular',
	'Muscular',
	'Tendinosa',
	'Neurológica',
];
const orderByOptions: AtendimentosOrderBy[] = ['data_registro', 'id', 'decisao_sred'];
const orderDirOptions: AtendimentosOrderDir[] = ['asc', 'desc'];
const pageSizeOptions = [10, 20, 50, 100];
const sredOptions: Exclude<SredFiltro, ''>[] = ['sim', 'nao'];

const defaultOrderDirectionByField: Record<AtendimentosOrderBy, AtendimentosOrderDir> = {
	data_registro: 'desc',
	id: 'desc',
	decisao_sred: 'asc',
};

const urlKeys = {
	page: 'atd_page',
	pageSize: 'atd_page_size',
	tipoLesao: 'atd_tipo_lesao',
	sred: 'atd_sred',
	busca: 'atd_q',
	dataInicio: 'atd_data_inicio',
	dataFim: 'atd_data_fim',
	orderBy: 'atd_order_by',
	orderDir: 'atd_order_dir',
} as const;

interface AtendimentosUrlState {
	tipoLesaoFiltro: TipoLesao | '';
	sredFiltro: SredFiltro;
	buscaFiltro: string;
	dataInicioFiltro: string;
	dataFimFiltro: string;
	paginaAtual: number;
	tamanhoPagina: number;
	ordenarPor: AtendimentosOrderBy;
	direcaoOrdenacao: AtendimentosOrderDir;
}

const defaultAtendimentosUrlState: AtendimentosUrlState = {
	tipoLesaoFiltro: '',
	sredFiltro: '',
	buscaFiltro: '',
	dataInicioFiltro: '',
	dataFimFiltro: '',
	paginaAtual: 1,
	tamanhoPagina: 20,
	ordenarPor: 'data_registro',
	direcaoOrdenacao: 'desc',
};

const readAtendimentosUrlState = (params: URLSearchParams): AtendimentosUrlState => {
	const tamanhoPaginaLido = readPositiveIntParam(
		params,
		urlKeys.pageSize,
		defaultAtendimentosUrlState.tamanhoPagina,
	);

	return {
		tipoLesaoFiltro: readEnumParam<TipoLesao>(
			params,
			urlKeys.tipoLesao,
			tipoLesaoOptions,
			defaultAtendimentosUrlState.tipoLesaoFiltro,
		),
		sredFiltro: readEnumParam<Exclude<SredFiltro, ''>>(
			params,
			urlKeys.sred,
			sredOptions,
			defaultAtendimentosUrlState.sredFiltro,
		) as SredFiltro,
		buscaFiltro: readStringParam(params, urlKeys.busca, defaultAtendimentosUrlState.buscaFiltro),
		dataInicioFiltro: readDateParam(
			params,
			urlKeys.dataInicio,
			defaultAtendimentosUrlState.dataInicioFiltro,
		),
		dataFimFiltro: readDateParam(params, urlKeys.dataFim, defaultAtendimentosUrlState.dataFimFiltro),
		paginaAtual: readPositiveIntParam(params, urlKeys.page, defaultAtendimentosUrlState.paginaAtual),
		tamanhoPagina: pageSizeOptions.includes(tamanhoPaginaLido)
			? tamanhoPaginaLido
			: defaultAtendimentosUrlState.tamanhoPagina,
		ordenarPor: readEnumParam<AtendimentosOrderBy>(
			params,
			urlKeys.orderBy,
			orderByOptions,
			defaultAtendimentosUrlState.ordenarPor,
		) as AtendimentosOrderBy,
		direcaoOrdenacao: readEnumParam<AtendimentosOrderDir>(
			params,
			urlKeys.orderDir,
			orderDirOptions,
			defaultAtendimentosUrlState.direcaoOrdenacao,
		) as AtendimentosOrderDir,
	};
};

const writeAtendimentosUrlState = (
	params: URLSearchParams,
	state: AtendimentosUrlState,
): void => {
	writeRequiredParam(params, urlKeys.page, String(state.paginaAtual));
	writeRequiredParam(params, urlKeys.pageSize, String(state.tamanhoPagina));
	writeRequiredParam(params, urlKeys.orderBy, state.ordenarPor);
	writeRequiredParam(params, urlKeys.orderDir, state.direcaoOrdenacao);
	writeOptionalParam(params, urlKeys.tipoLesao, state.tipoLesaoFiltro);
	writeOptionalParam(params, urlKeys.sred, state.sredFiltro);
	writeOptionalTrimmedParam(params, urlKeys.busca, state.buscaFiltro);
	writeOptionalParam(params, urlKeys.dataInicio, state.dataInicioFiltro);
	writeOptionalParam(params, urlKeys.dataFim, state.dataFimFiltro);
};

export const AtendimentosPage = () => {
	const initialUrlState = useInitialUrlQueryState(readAtendimentosUrlState);
	const { data, isLoading, isError, refetch } = useAtendimentos();
	const [tipoLesaoFiltro, setTipoLesaoFiltro] = useState<TipoLesao | ''>(
		initialUrlState.tipoLesaoFiltro,
	);
	const [sredFiltro, setSredFiltro] = useState<SredFiltro>(initialUrlState.sredFiltro);
	const [buscaFiltro, setBuscaFiltro] = useState(initialUrlState.buscaFiltro);
	const [dataInicioFiltro, setDataInicioFiltro] = useState(initialUrlState.dataInicioFiltro);
	const [dataFimFiltro, setDataFimFiltro] = useState(initialUrlState.dataFimFiltro);
	const [paginaAtual, setPaginaAtual] = useState(initialUrlState.paginaAtual);
	const [tamanhoPagina, setTamanhoPagina] = useState(initialUrlState.tamanhoPagina);
	const [ordenarPor, setOrdenarPor] = useState<AtendimentosOrderBy>(initialUrlState.ordenarPor);
	const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<AtendimentosOrderDir>(
		initialUrlState.direcaoOrdenacao,
	);

	const filteredItems = useMemo(() => {
		if (!data) {
			return [];
		}

		const buscaNormalizada = buscaFiltro.trim().toLowerCase();
		const inicioTs = dataInicioFiltro ? new Date(`${dataInicioFiltro}T00:00:00`).getTime() : null;
		const fimTs = dataFimFiltro ? new Date(`${dataFimFiltro}T23:59:59`).getTime() : null;

		return data.filter((item) => {
			if (tipoLesaoFiltro && item.tipo_lesao !== tipoLesaoFiltro) {
				return false;
			}

			if (sredFiltro === 'sim' && !item.flag_sred) {
				return false;
			}

			if (sredFiltro === 'nao' && item.flag_sred) {
				return false;
			}

			if (buscaNormalizada) {
				const textoBusca = [item.estrutura_anatomica, item.notas_clinicas]
					.join(' ')
					.toLowerCase();
				if (!textoBusca.includes(buscaNormalizada)) {
					return false;
				}
			}

			if (inicioTs !== null || fimTs !== null) {
				const registroTs = new Date(item.data_registro).getTime();
				if (Number.isNaN(registroTs)) {
					return false;
				}
				if (inicioTs !== null && registroTs < inicioTs) {
					return false;
				}
				if (fimTs !== null && registroTs > fimTs) {
					return false;
				}
			}

			return true;
		});
	}, [data, tipoLesaoFiltro, sredFiltro, buscaFiltro, dataInicioFiltro, dataFimFiltro]);

	const sortedItems = useMemo(() => {
		const items = [...filteredItems];
		items.sort((a, b) => {
			let compare = 0;

			if (ordenarPor === 'id') {
				compare = a.id - b.id;
			} else if (ordenarPor === 'decisao_sred') {
				const rank = (value: string): number => {
					if (value === 'S-RED Positivo') {
						return 2;
					}
					if (value === 'S-RED Negativo') {
						return 1;
					}
					return 0;
				};
				compare = rank(a.decisao_sred) - rank(b.decisao_sred);
			} else {
				compare = new Date(a.data_registro).getTime() - new Date(b.data_registro).getTime();
			}

			return direcaoOrdenacao === 'asc' ? compare : -compare;
		});

		return items;
	}, [filteredItems, ordenarPor, direcaoOrdenacao]);

	const totalItens = sortedItems.length;
	const totalPaginas = totalItens > 0 ? Math.ceil(totalItens / tamanhoPagina) : 0;
	const {
		pageInput: paginaDestinoInput,
		setPageInput: setPaginaDestinoInput,
		effectivePage: paginaExibida,
		canGoPrevious: podeVoltarPagina,
		canGoNext: podeAvancarPagina,
		goPrevious: handlePaginaAnterior,
		goNext: handleProximaPagina,
		goToInputPage: handleIrParaPagina,
	} = usePaginationControls({
		currentPage: paginaAtual,
		totalPages: totalPaginas,
		setCurrentPage: setPaginaAtual,
		isReady: !isLoading,
	});

	const paginatedItems = useMemo(() => {
		const offset = (paginaExibida - 1) * tamanhoPagina;
		return sortedItems.slice(offset, offset + tamanhoPagina);
	}, [sortedItems, paginaExibida, tamanhoPagina]);

	const urlState = useMemo<AtendimentosUrlState>(
		() => ({
			tipoLesaoFiltro,
			sredFiltro,
			buscaFiltro,
			dataInicioFiltro,
			dataFimFiltro,
			paginaAtual,
			tamanhoPagina,
			ordenarPor,
			direcaoOrdenacao,
		}),
		[
			tipoLesaoFiltro,
			sredFiltro,
			buscaFiltro,
			dataInicioFiltro,
			dataFimFiltro,
			paginaAtual,
			tamanhoPagina,
			ordenarPor,
			direcaoOrdenacao,
		],
	);

	useSyncUrlQueryState(writeAtendimentosUrlState, urlState);

	const handleLimparFiltros = () => {
		setTipoLesaoFiltro('');
		setSredFiltro('');
		setBuscaFiltro('');
		setDataInicioFiltro('');
		setDataFimFiltro('');
		setPaginaAtual(1);
		setTamanhoPagina(20);
		setOrdenarPor('data_registro');
		setDirecaoOrdenacao('desc');
	};

	const handleOrdenacaoTabela = (campo: AtendimentosOrderBy) => {
		setPaginaAtual(1);
		if (ordenarPor === campo) {
			setDirecaoOrdenacao((current) => (current === 'asc' ? 'desc' : 'asc'));
			return;
		}

		setOrdenarPor(campo);
		setDirecaoOrdenacao(defaultOrderDirectionByField[campo]);
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

			<SectionCard title="Consulta de Atendimentos" subtitle="Filtros, ordenação e paginação com persistência na URL.">
				<Stack spacing={1.5}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<TextField
							label="Buscar (estrutura/notas)"
							value={buscaFiltro}
							onChange={(event) => {
								setBuscaFiltro(event.target.value);
								setPaginaAtual(1);
							}}
							sx={{ minWidth: { xs: '100%', sm: 240 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							select
							label="Tipo de lesão"
							value={tipoLesaoFiltro}
							onChange={(event) => {
								setTipoLesaoFiltro(event.target.value as TipoLesao | '');
								setPaginaAtual(1);
							}}
							sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{tipoLesaoOptions.map((tipo) => (
								<MenuItem key={tipo} value={tipo}>
									{tipo}
								</MenuItem>
							))}
						</TextField>
						<TextField
							select
							label="S-RED"
							value={sredFiltro}
							onChange={(event) => {
								setSredFiltro(event.target.value as SredFiltro);
								setPaginaAtual(1);
							}}
							sx={{ minWidth: { xs: '100%', sm: 160 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							<MenuItem value="sim">Somente S-RED</MenuItem>
							<MenuItem value="nao">Sem S-RED</MenuItem>
						</TextField>
					</Stack>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<TextField
							label="Data início"
							type="date"
							value={dataInicioFiltro}
							onChange={(event) => {
								setDataInicioFiltro(event.target.value);
								setPaginaAtual(1);
							}}
							InputLabelProps={{ shrink: true }}
							sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							label="Data fim"
							type="date"
							value={dataFimFiltro}
							onChange={(event) => {
								setDataFimFiltro(event.target.value);
								setPaginaAtual(1);
							}}
							InputLabelProps={{ shrink: true }}
							sx={{ minWidth: { xs: '100%', sm: 180 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
						<TextField
							select
							label="Ordenar por"
							value={ordenarPor}
							onChange={(event) => {
								setOrdenarPor(event.target.value as AtendimentosOrderBy);
								setPaginaAtual(1);
							}}
							sx={{ minWidth: { xs: '100%', sm: 170 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="data_registro">Data</MenuItem>
							<MenuItem value="id">ID</MenuItem>
							<MenuItem value="decisao_sred">Decisão S-RED</MenuItem>
						</TextField>
						<TextField
							select
							label="Direção"
							value={direcaoOrdenacao}
							onChange={(event) => {
								setDirecaoOrdenacao(event.target.value as AtendimentosOrderDir);
								setPaginaAtual(1);
							}}
							sx={{ minWidth: { xs: '100%', sm: 150 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="desc">Descendente</MenuItem>
							<MenuItem value="asc">Ascendente</MenuItem>
						</TextField>
						<TextField
							select
							label="Itens por página"
							value={String(tamanhoPagina)}
							onChange={(event) => {
								setTamanhoPagina(Number(event.target.value));
								setPaginaAtual(1);
							}}
							sx={{ minWidth: { xs: '100%', sm: 170 }, '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							{pageSizeOptions.map((size) => (
								<MenuItem key={size} value={String(size)}>
									{size}
								</MenuItem>
							))}
						</TextField>
					</Stack>

					<FilterActionsRow
						refreshLabel="Atualizar lista"
						onRefresh={() => void refetch()}
						refreshDisabled={isLoading}
						onClear={handleLimparFiltros}
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
						Total: {totalItens} registro(s) · Página {paginaExibida} de {totalPaginas}
					</Typography>
					<AtendimentoList
						items={paginatedItems}
						orderBy={ordenarPor}
						orderDir={direcaoOrdenacao}
						onSortChange={handleOrdenacaoTabela}
					/>
					<PaginationControlsRow
						canGoPrevious={podeVoltarPagina}
						canGoNext={podeAvancarPagina}
						onGoPrevious={handlePaginaAnterior}
						onGoNext={handleProximaPagina}
						pageInput={paginaDestinoInput}
						onPageInputChange={setPaginaDestinoInput}
						onGoToPage={handleIrParaPagina}
					/>
				</>
			)}
		</Stack>
	);
};

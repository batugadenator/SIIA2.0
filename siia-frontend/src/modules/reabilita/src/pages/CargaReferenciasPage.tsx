import { useMemo, useState } from 'react';

import {
	Button,
	Chip,
	CircularProgress,
	FormControlLabel,
	List,
	ListItem,
	ListItemText,
	MenuItem,
	Stack,
	Switch,
	TextField,
	Typography,
} from '@mui/material';

import { FilterActionsRow, PaginationControlsRow } from '../components/common';
import { EmptyState, SectionCard, useNotify } from '../design-system';
import {
	useExecutarCargaReferencias,
	useHistoricoCargaReferencias,
} from '../hooks/useCargaReferencias';
import { usePaginationControls } from '../hooks/usePaginationControls';
import {
	readDateParam,
	readEnumParam,
	readPositiveIntParam,
	useInitialUrlQueryState,
	useSyncUrlQueryState,
	writeOptionalParam,
	writeRequiredParam,
} from '../hooks/useUrlQueryState';
import type {
	CargaHistoricoItem,
	CargaHistoricoOrderBy,
	CargaHistoricoOrderDir,
	CargaStatus,
	HistoricoCargaFiltros,
} from '../types/cargaReferencias';

const statusColorMap: Record<CargaStatus, 'success' | 'warning' | 'error'> = {
	SUCESSO: 'success',
	SEM_ALTERACAO: 'warning',
	FALHA: 'error',
};

const formatDateTime = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return value;
	}
	return date.toLocaleString('pt-BR');
};

const buildResumoLabel = (item: CargaHistoricoItem) => {
	const resumo = item.resumo ?? {};
	const sac = resumo.sac_carregados ?? 0;
	const referencias = resumo.referencias_lesao_carregadas ?? 0;
	return `SAC ${sac} · Referências de lesão ${referencias}`;
};

const statusOptions: CargaStatus[] = ['SUCESSO', 'SEM_ALTERACAO', 'FALHA'];
const orderByOptions: CargaHistoricoOrderBy[] = ['criado_em', 'status', 'id'];
const orderDirOptions: CargaHistoricoOrderDir[] = ['asc', 'desc'];
const pageSizeOptions = [10, 20, 50, 100];

const urlKeys = {
	page: 'hist_page',
	pageSize: 'hist_page_size',
	status: 'hist_status',
	dataInicio: 'hist_data_inicio',
	dataFim: 'hist_data_fim',
	orderBy: 'hist_order_by',
	orderDir: 'hist_order_dir',
} as const;

interface CargaHistoricoUrlState {
	statusFiltro: CargaStatus | '';
	dataInicioFiltro: string;
	dataFimFiltro: string;
	paginaAtual: number;
	tamanhoPagina: number;
	ordenarPor: CargaHistoricoOrderBy;
	direcaoOrdenacao: CargaHistoricoOrderDir;
}

const defaultCargaHistoricoUrlState: CargaHistoricoUrlState = {
	statusFiltro: '',
	dataInicioFiltro: '',
	dataFimFiltro: '',
	paginaAtual: 1,
	tamanhoPagina: 20,
	ordenarPor: 'criado_em',
	direcaoOrdenacao: 'desc',
};

const readCargaHistoricoUrlState = (params: URLSearchParams): CargaHistoricoUrlState => {
	const tamanhoPaginaLido = readPositiveIntParam(
		params,
		urlKeys.pageSize,
		defaultCargaHistoricoUrlState.tamanhoPagina,
	);

	return {
		statusFiltro: readEnumParam<CargaStatus>(
			params,
			urlKeys.status,
			statusOptions,
			defaultCargaHistoricoUrlState.statusFiltro,
		),
		dataInicioFiltro: readDateParam(
			params,
			urlKeys.dataInicio,
			defaultCargaHistoricoUrlState.dataInicioFiltro,
		),
		dataFimFiltro: readDateParam(
			params,
			urlKeys.dataFim,
			defaultCargaHistoricoUrlState.dataFimFiltro,
		),
		paginaAtual: readPositiveIntParam(params, urlKeys.page, defaultCargaHistoricoUrlState.paginaAtual),
		tamanhoPagina: pageSizeOptions.includes(tamanhoPaginaLido)
			? tamanhoPaginaLido
			: defaultCargaHistoricoUrlState.tamanhoPagina,
		ordenarPor: readEnumParam<CargaHistoricoOrderBy>(
			params,
			urlKeys.orderBy,
			orderByOptions,
			defaultCargaHistoricoUrlState.ordenarPor,
		) as CargaHistoricoOrderBy,
		direcaoOrdenacao: readEnumParam<CargaHistoricoOrderDir>(
			params,
			urlKeys.orderDir,
			orderDirOptions,
			defaultCargaHistoricoUrlState.direcaoOrdenacao,
		) as CargaHistoricoOrderDir,
	};
};

const writeCargaHistoricoUrlState = (
	params: URLSearchParams,
	state: CargaHistoricoUrlState,
): void => {
	writeRequiredParam(params, urlKeys.page, String(state.paginaAtual));
	writeRequiredParam(params, urlKeys.pageSize, String(state.tamanhoPagina));
	writeRequiredParam(params, urlKeys.orderBy, state.ordenarPor);
	writeRequiredParam(params, urlKeys.orderDir, state.direcaoOrdenacao);
	writeOptionalParam(params, urlKeys.status, state.statusFiltro);
	writeOptionalParam(params, urlKeys.dataInicio, state.dataInicioFiltro);
	writeOptionalParam(params, urlKeys.dataFim, state.dataFimFiltro);
};

export const CargaReferenciasPage = () => {
	const notify = useNotify();
	const initialUrlState = useInitialUrlQueryState(readCargaHistoricoUrlState);
	const [reset, setReset] = useState(false);
	const [force, setForce] = useState(false);
	const [statusFiltro, setStatusFiltro] = useState<CargaStatus | ''>(initialUrlState.statusFiltro);
	const [dataInicioFiltro, setDataInicioFiltro] = useState(initialUrlState.dataInicioFiltro);
	const [dataFimFiltro, setDataFimFiltro] = useState(initialUrlState.dataFimFiltro);
	const [paginaAtual, setPaginaAtual] = useState(initialUrlState.paginaAtual);
	const [tamanhoPagina, setTamanhoPagina] = useState(initialUrlState.tamanhoPagina);
	const [ordenarPor, setOrdenarPor] = useState<CargaHistoricoOrderBy>(initialUrlState.ordenarPor);
	const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<CargaHistoricoOrderDir>(
		initialUrlState.direcaoOrdenacao,
	);

	const filtrosHistorico = useMemo<HistoricoCargaFiltros>(
		() => ({
			page: paginaAtual,
			page_size: tamanhoPagina,
			status: statusFiltro || undefined,
			data_inicio: dataInicioFiltro || undefined,
			data_fim: dataFimFiltro || undefined,
			order_by: ordenarPor,
			order_dir: direcaoOrdenacao,
		}),
		[
			paginaAtual,
			tamanhoPagina,
			statusFiltro,
			dataInicioFiltro,
			dataFimFiltro,
			ordenarPor,
			direcaoOrdenacao,
		],
	);

	const {
		data: historicoResponse,
		isLoading,
		isError,
		refetch,
	} = useHistoricoCargaReferencias(filtrosHistorico);
	const { mutateAsync, isPending } = useExecutarCargaReferencias();

	const historico = historicoResponse?.items ?? [];
	const pagination = historicoResponse?.pagination;
	const totalItens = pagination?.total ?? 0;
	const totalPaginas = pagination?.total_pages ?? 0;
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
		onInvalidInput: () => {
			notify('Informe um número de página válido.', 'warning');
		},
		onInputClamped: (maxPage) => {
			notify(`Página ajustada para o máximo disponível (${maxPage}).`, 'info');
		},
	});

	const hasItems = useMemo(() => historico.length > 0, [historico]);
	const urlState = useMemo<CargaHistoricoUrlState>(
		() => ({
			statusFiltro,
			dataInicioFiltro,
			dataFimFiltro,
			paginaAtual,
			tamanhoPagina,
			ordenarPor,
			direcaoOrdenacao,
		}),
		[
			statusFiltro,
			dataInicioFiltro,
			dataFimFiltro,
			paginaAtual,
			tamanhoPagina,
			ordenarPor,
			direcaoOrdenacao,
		],
	);

	useSyncUrlQueryState(writeCargaHistoricoUrlState, urlState);

	const handleExecutarCarga = async () => {
		try {
			const result = await mutateAsync({ reset, force });
			if (result.status === 'SUCESSO') {
				notify('Carga de referências concluída com sucesso.', 'success');
			} else if (result.status === 'SEM_ALTERACAO') {
				notify('Nenhuma alteração detectada nos CSVs.', 'info');
			} else {
				notify('Carga concluída com falha. Verifique o histórico.', 'error');
			}
		} catch {
			notify('Falha ao executar carga de referências.', 'error');
		}
	};

	const handleReexecutarCarga = async (item: CargaHistoricoItem) => {
		try {
			const result = await mutateAsync({
				reset: item.reset,
				force: item.force,
			});

			if (result.status === 'SUCESSO') {
				notify(`Carga #${item.id} reexecutada com sucesso.`, 'success');
			} else if (result.status === 'SEM_ALTERACAO') {
				notify(`Carga #${item.id} reexecutada sem alterações.`, 'info');
			} else {
				notify(`Carga #${item.id} reexecutada com falha.`, 'error');
			}
		} catch {
			notify(`Falha ao reexecutar carga #${item.id}.`, 'error');
		}
	};

	const handleLimparFiltros = () => {
		setStatusFiltro('');
		setDataInicioFiltro('');
		setDataFimFiltro('');
		setPaginaAtual(1);
		setTamanhoPagina(20);
		setOrdenarPor('criado_em');
		setDirecaoOrdenacao('desc');
	};

	return (
		<Stack spacing={2}>
			<SectionCard
				title="Carga de Referências"
				subtitle="Dispare recarga manual e acompanhe o histórico das últimas execuções."
			>
				<Stack spacing={2}>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<FormControlLabel
							control={<Switch checked={reset} onChange={(_, checked) => setReset(checked)} />}
							label="Reset"
						/>
						<FormControlLabel
							control={<Switch checked={force} onChange={(_, checked) => setForce(checked)} />}
							label="Force"
						/>
					</Stack>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<Button
							variant="contained"
							onClick={() => void handleExecutarCarga()}
							disabled={isPending}
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							{isPending ? 'Executando...' : 'Executar carga'}
						</Button>
						<Button
							variant="outlined"
							onClick={() => void refetch()}
							disabled={isLoading}
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							Atualizar histórico
						</Button>
					</Stack>
				</Stack>
			</SectionCard>

			<SectionCard title="Histórico de Cargas" subtitle="Execuções da rotina de ETL com filtros, ordenação e paginação.">
				<Stack spacing={1.5} mb={2}>
					<Typography variant="subtitle2">Filtros</Typography>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<TextField
							select
							label="Status"
							value={statusFiltro}
							onChange={(event) => {
								setStatusFiltro(event.target.value as CargaStatus | '');
								setPaginaAtual(1);
							}}
							sx={{
								minWidth: { xs: '100%', sm: 180 },
								'& .MuiInputBase-root': { minHeight: 44 },
							}}
						>
							<MenuItem value="">Todos</MenuItem>
							<MenuItem value="SUCESSO">SUCESSO</MenuItem>
							<MenuItem value="SEM_ALTERACAO">SEM_ALTERACAO</MenuItem>
							<MenuItem value="FALHA">FALHA</MenuItem>
						</TextField>
						<TextField
							label="Data início"
							type="date"
							value={dataInicioFiltro}
							onChange={(event) => {
								setDataInicioFiltro(event.target.value);
								setPaginaAtual(1);
							}}
							InputLabelProps={{ shrink: true }}
							sx={{
								minWidth: { xs: '100%', sm: 180 },
								'& .MuiInputBase-root': { minHeight: 44 },
							}}
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
							sx={{
								minWidth: { xs: '100%', sm: 180 },
								'& .MuiInputBase-root': { minHeight: 44 },
							}}
						/>
					</Stack>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<TextField
							select
							label="Ordenar por"
							value={ordenarPor}
							onChange={(event) => {
								setOrdenarPor(event.target.value as CargaHistoricoOrderBy);
								setPaginaAtual(1);
							}}
							sx={{
								minWidth: { xs: '100%', sm: 180 },
								'& .MuiInputBase-root': { minHeight: 44 },
							}}
						>
							<MenuItem value="criado_em">Data</MenuItem>
							<MenuItem value="status">Status</MenuItem>
							<MenuItem value="id">ID</MenuItem>
						</TextField>
						<TextField
							select
							label="Direção"
							value={direcaoOrdenacao}
							onChange={(event) => {
								setDirecaoOrdenacao(event.target.value as CargaHistoricoOrderDir);
								setPaginaAtual(1);
							}}
							sx={{
								minWidth: { xs: '100%', sm: 180 },
								'& .MuiInputBase-root': { minHeight: 44 },
							}}
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
							sx={{
								minWidth: { xs: '100%', sm: 180 },
								'& .MuiInputBase-root': { minHeight: 44 },
							}}
						>
							<MenuItem value="10">10</MenuItem>
							<MenuItem value="20">20</MenuItem>
							<MenuItem value="50">50</MenuItem>
							<MenuItem value="100">100</MenuItem>
						</TextField>
					</Stack>
					<FilterActionsRow
						refreshLabel="Atualizar histórico"
						onRefresh={() => void refetch()}
						refreshDisabled={isLoading}
						onClear={handleLimparFiltros}
					/>
				</Stack>

				{isLoading ? (
					<Stack alignItems="center" justifyContent="center" minHeight="30vh">
						<CircularProgress />
					</Stack>
				) : null}

				{!isLoading && isError ? (
					<EmptyState
						title="Falha ao carregar histórico"
						description="Verifique a conexão/permissão e tente novamente."
						action={
							<Button
								variant="contained"
								onClick={() => void refetch()}
								sx={{ minHeight: 44, minWidth: 44 }}
							>
								Tentar novamente
							</Button>
						}
						height="30vh"
					/>
				) : null}

				{!isLoading && !isError && !hasItems ? (
					<EmptyState
						title="Sem histórico de cargas"
						description="Execute uma carga para gerar o primeiro registro de auditoria."
						height="30vh"
					/>
				) : null}

				{!isLoading && !isError && hasItems ? (
					<Stack spacing={1.5}>
						<Typography variant="body2" color="text.secondary">
							Total: {totalItens} registro(s) · Página {paginaExibida} de {totalPaginas}
						</Typography>
						<List disablePadding>
							{historico.map((item) => (
								<ListItem key={item.id} divider alignItems="flex-start" sx={{ px: 0 }}>
									<ListItemText
										primary={
											<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
												<Typography variant="subtitle2">Carga #{item.id}</Typography>
												<Chip
													size="small"
													color={statusColorMap[item.status]}
													label={item.status}
												/>
												{item.reset ? <Chip size="small" variant="outlined" label="RESET" /> : null}
												{item.force ? <Chip size="small" variant="outlined" label="FORCE" /> : null}
											</Stack>
										}
										secondary={
											<Stack spacing={0.5} mt={1}>
												<Typography variant="body2" color="text.secondary">
													{formatDateTime(item.criado_em)}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Parâmetros: reset={String(item.reset)} · force={String(item.force)}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{buildResumoLabel(item)}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													Arquivos alterados:{' '}
													{item.arquivos_alterados.length > 0
														? item.arquivos_alterados.join(', ')
														: 'nenhum'}
												</Typography>
												<Button
													variant="outlined"
													onClick={() => void handleReexecutarCarga(item)}
													disabled={isPending}
													sx={{
														minHeight: 44,
														minWidth: 44,
														alignSelf: { xs: 'stretch', sm: 'flex-start' },
													}}
												>
													Reexecutar mesmos parâmetros
												</Button>
												{item.mensagem ? (
													<Typography variant="body2" color="error.main">
														{item.mensagem}
													</Typography>
												) : null}
											</Stack>
										}
									/>
								</ListItem>
							))}
						</List>
						<PaginationControlsRow
							canGoPrevious={podeVoltarPagina}
							canGoNext={podeAvancarPagina}
							onGoPrevious={handlePaginaAnterior}
							onGoNext={handleProximaPagina}
							pageInput={paginaDestinoInput}
							onPageInputChange={setPaginaDestinoInput}
							onGoToPage={handleIrParaPagina}
							isBusy={isLoading}
							disableGo={totalPaginas === 0}
						/>
					</Stack>
				) : null}
			</SectionCard>
		</Stack>
	);
};

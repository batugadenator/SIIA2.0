import { useEffect, useMemo, useState } from 'react';

import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';
import LoopOutlinedIcon from '@mui/icons-material/LoopOutlined';
import ManOutlinedIcon from '@mui/icons-material/Man2Outlined';
import WomanOutlinedIcon from '@mui/icons-material/WomanOutlined';
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogContent,
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
import { alpha } from '@mui/material/styles';

import { SectionCard } from '../design-system';
import { usePainelClinico } from '../hooks/usePainelClinico';
import type { PainelClinicoResponse } from '../types/painelClinico';

const buildFallbackMeses = () => {
	const now = new Date();
	const meses = [] as PainelClinicoResponse['atendimentos_ultimos_6_meses'];

	for (let i = 5; i >= 0; i -= 1) {
		const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
		meses.push({
			mes: `${String(monthDate.getMonth() + 1).padStart(2, '0')}/${monthDate.getFullYear()}`,
			total: 0,
		});
	}

	return meses;
};

const fallbackPainelClinico: PainelClinicoResponse = {
	metricas: {
		cadetes: 0,
		atendimentos: 0,
		atendimentos_homens: 0,
		atendimentos_mulheres: 0,
		por_data: 0,
		retornos: 0,
	},
	atendimentos_ultimos_6_meses: buildFallbackMeses(),
	encaminhamentos_por_perfil: [
		{ perfil: 'Médico', percentual: 0, total: 0 },
		{ perfil: 'Fisioterapeuta', percentual: 0, total: 0 },
		{ perfil: 'PEF', percentual: 0, total: 0 },
		{ perfil: 'Nutricionista', percentual: 0, total: 0 },
		{ perfil: 'Psicopedagogo', percentual: 0, total: 0 },
	],
	ultimos_atendimentos: [],
	atendimentos_iniciais_analitico: [],
};

type MetricPalette = 'primary' | 'success' | 'info' | 'secondary';

interface MetricCardConfig {
	key: string;
	title: string;
	value: number;
	palette: MetricPalette;
	icon: JSX.Element;
}

const normalizeText = (value: string): string =>
	(value || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();

const isAtividadeExcluida = (atividade: string): boolean => {
	const normalized = normalizeText(atividade);
	return /retorno|pos[- ]?operatorio/.test(normalized);
};

const sortAnoCfo = (left: string, right: string): number => {
	const extract = (value: string): number => {
		const match = value.match(/(\d+)/);
		return match ? Number.parseInt(match[1], 10) : Number.POSITIVE_INFINITY;
	};

	const leftNum = extract(left);
	const rightNum = extract(right);

	if (leftNum !== rightNum) {
		return leftNum - rightNum;
	}

	return left.localeCompare(right, 'pt-BR');
};

const clampPercent = (value: number): number => {
	if (value < 0) return 0;
	if (value > 100) return 100;
	return value;
};

interface GenderCardProps {
	title: string;
	percentual: number;
	icon: JSX.Element;
	color: 'info' | 'success';
}

const GenderCard = ({ title, percentual, icon, color }: GenderCardProps) => {
	const seguro = clampPercent(percentual);

	return (
		<SectionCard
			title={
				<Typography variant="overline" color="text.secondary" fontWeight={700}>
					{title}
				</Typography>
			}
			action={
				<Box
					sx={(theme) => ({
						width: 32,
						height: 32,
						borderRadius: 1,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						color: theme.palette[color].main,
						backgroundColor: alpha(theme.palette[color].main, 0.2),
					})}
				>
					{icon}
				</Box>
			}
			sx={{ flex: '1 1 260px' }}
		>
			<Stack direction="row" alignItems="center" spacing={2}>
				<Box
					sx={(theme) => ({
						width: 82,
						height: 82,
						borderRadius: '50%',
						background: `conic-gradient(${theme.palette[color].main} ${seguro}%, ${alpha(theme.palette[color].main, 0.16)} 0)`,
						display: 'grid',
						placeItems: 'center',
					})}
				>
					<Box
						sx={(theme) => ({
							width: 58,
							height: 58,
							borderRadius: '50%',
							backgroundColor: theme.palette.background.paper,
							display: 'grid',
							placeItems: 'center',
						})}
					>
						<Typography variant="caption" fontWeight={700} color={`${color}.main`}>
							{seguro.toFixed(1)}%
						</Typography>
					</Box>
				</Box>
				<Stack>
					<Typography variant="body2" color="text.secondary">
						Percentual sobre o efetivo total de cadetes
					</Typography>
				</Stack>
			</Stack>
		</SectionCard>
	);
};

export const DashboardPage = () => {
	const { data, isLoading, isError, refetch } = usePainelClinico();
	const painel = data ?? fallbackPainelClinico;
	const [isSredPopupOpen, setIsSredPopupOpen] = useState(false);
	const [filtroAno, setFiltroAno] = useState('');
	const [filtroCurso, setFiltroCurso] = useState('');
	const [filtroSexo, setFiltroSexo] = useState('');
	const [filtroAtividade, setFiltroAtividade] = useState('');

	useEffect(() => {
		const shouldShowPopup = sessionStorage.getItem('show_sred_popup') === '1';
		if (shouldShowPopup) {
			setIsSredPopupOpen(true);
			sessionStorage.removeItem('show_sred_popup');
		}
	}, []);

	const maiorVolumeMensal = useMemo(() => {
		return Math.max(1, ...painel.atendimentos_ultimos_6_meses.map((item) => item.total));
	}, [painel.atendimentos_ultimos_6_meses]);

	const metricCards = useMemo<MetricCardConfig[]>(
		() => [
			{
				key: 'cadetes',
				title: 'CADETES',
				value: painel.metricas.cadetes,
				palette: 'primary',
				icon: <Diversity3OutlinedIcon fontSize="small" />,
			},
			{
				key: 'atendimentos',
				title: 'ATENDIMENTOS',
				value: painel.metricas.atendimentos,
				palette: 'success',
				icon: <AssignmentOutlinedIcon fontSize="small" />,
			},
			{
				key: 'hoje',
				title: 'HOJE',
				value: painel.metricas.por_data,
				palette: 'info',
				icon: <CalendarMonthOutlinedIcon fontSize="small" />,
			},
			{
				key: 'retornos',
				title: 'RETORNOS',
				value: painel.metricas.retornos,
				palette: 'secondary',
				icon: <LoopOutlinedIcon fontSize="small" />,
			},
		],
		[
			painel.metricas.atendimentos,
			painel.metricas.cadetes,
			painel.metricas.por_data,
			painel.metricas.retornos,
		],
	);

	const percentualMasculino =
		painel.metricas.cadetes > 0
			? (painel.metricas.atendimentos_homens / painel.metricas.cadetes) * 100
			: 0;
	const percentualFeminino =
		painel.metricas.cadetes > 0
			? (painel.metricas.atendimentos_mulheres / painel.metricas.cadetes) * 100
			: 0;

	const analyticsBase = useMemo(
		() => painel.atendimentos_iniciais_analitico.filter((item) => !isAtividadeExcluida(item.atividade)),
		[painel.atendimentos_iniciais_analitico],
	);

	const anosDisponiveis = useMemo(
		() => Array.from(new Set(analyticsBase.map((item) => item.ano))).sort(sortAnoCfo),
		[analyticsBase],
	);
	const cursosDisponiveis = useMemo(
		() => Array.from(new Set(analyticsBase.map((item) => item.curso))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[analyticsBase],
	);
	const sexosDisponiveis = useMemo(
		() => Array.from(new Set(analyticsBase.map((item) => item.sexo))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[analyticsBase],
	);
	const atividadesDisponiveis = useMemo(
		() => Array.from(new Set(analyticsBase.map((item) => item.atividade))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[analyticsBase],
	);

	const atendimentosFiltrados = useMemo(() => {
		return analyticsBase.filter((item) => {
			if (filtroAno && item.ano !== filtroAno) return false;
			if (filtroCurso && item.curso !== filtroCurso) return false;
			if (filtroSexo && item.sexo !== filtroSexo) return false;
			if (filtroAtividade && item.atividade !== filtroAtividade) return false;
			return true;
		});
	}, [analyticsBase, filtroAno, filtroCurso, filtroSexo, filtroAtividade]);

	const heatmapAnos = useMemo(
		() => Array.from(new Set(atendimentosFiltrados.map((item) => item.ano))).sort(sortAnoCfo),
		[atendimentosFiltrados],
	);
	const heatmapCursos = useMemo(
		() => Array.from(new Set(atendimentosFiltrados.map((item) => item.curso))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
		[atendimentosFiltrados],
	);

	const totalFiltrado = atendimentosFiltrados.length;

	const heatmapMatrix = useMemo(() => {
		const counters = new Map<string, number>();

		for (const item of atendimentosFiltrados) {
			const key = `${item.ano}|${item.curso}`;
			counters.set(key, (counters.get(key) ?? 0) + 1);
		}

		const matrix = heatmapAnos.map((ano) => {
			return heatmapCursos.map((curso) => {
				const total = counters.get(`${ano}|${curso}`) ?? 0;
				const percentual = totalFiltrado > 0 ? (total / totalFiltrado) * 100 : 0;
				return { ano, curso, total, percentual };
			});
		});

		const percentuaisValidos = matrix.flat().map((cell) => cell.percentual).filter((percentual) => percentual > 0);
		const minPercentual = percentuaisValidos.length > 0 ? Math.min(...percentuaisValidos) : 0;
		const maxPercentual = percentuaisValidos.length > 0 ? Math.max(...percentuaisValidos) : 0;

		return {
			matrix,
			minPercentual,
			maxPercentual,
		};
	}, [atendimentosFiltrados, heatmapAnos, heatmapCursos, totalFiltrado]);

	const paretoData = useMemo(() => {
		const counts = new Map<string, number>();

		for (const item of atendimentosFiltrados) {
			counts.set(item.atividade, (counts.get(item.atividade) ?? 0) + 1);
		}

		const ordered = Array.from(counts.entries())
			.map(([atividade, total]) => ({ atividade, total }))
			.sort((a, b) => b.total - a.total);

		let acumulado = 0;

		return ordered.map((item) => {
			const percentual = totalFiltrado > 0 ? (item.total / totalFiltrado) * 100 : 0;
			acumulado += percentual;
			return {
				...item,
				percentual,
				acumuladoPercentual: acumulado,
			};
		});
	}, [atendimentosFiltrados, totalFiltrado]);

	const paretoSvg = useMemo(() => {
		const width = Math.max(540, paretoData.length * 90);
		const height = 260;
		const barBottom = 210;
		const barAreaHeight = 150;
		const barWidth = 42;
		const maxTotal = Math.max(1, ...paretoData.map((item) => item.total));

		const points = paretoData
			.map((item, index) => {
				const x = 55 + index * 90 + barWidth / 2;
				const y = barBottom - (item.acumuladoPercentual / 100) * barAreaHeight;
				return `${x},${y}`;
			})
			.join(' ');

		return { width, height, barBottom, barAreaHeight, barWidth, maxTotal, points };
	}, [paretoData]);

	if (isLoading) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="45vh">
				<CircularProgress />
			</Stack>
		);
	}

	return (
		<Stack spacing={2}>
			<Dialog open={isSredPopupOpen} onClose={() => setIsSredPopupOpen(false)} maxWidth="md" fullWidth>
				<DialogContent sx={{ p: 0 }}>
					<Box
						component="img"
						src="/pop_pup_srad.png"
						alt="Protocolo S-RED"
						sx={{ width: '100%', height: 'auto', display: 'block' }}
					/>
					<Stack direction="row" justifyContent="flex-end" sx={{ p: 2 }}>
						<Button variant="contained" onClick={() => setIsSredPopupOpen(false)} sx={{ minHeight: 44, minWidth: 44 }}>
							Fechar
						</Button>
					</Stack>
				</DialogContent>
			</Dialog>

			<Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
				Painel Clínico
			</Typography>
			<Typography variant="subtitle1" color="text.secondary">
				Protocolo S-RED • Atendimento Multidisciplinar
			</Typography>

			{isError ? (
				<Alert
					severity="warning"
					action={
						<Button color="inherit" size="small" onClick={() => void refetch()}>
							Tentar novamente
						</Button>
					}
				>
					Não foi possível obter os dados do backend. Exibindo fallback previsível do painel.
				</Alert>
			) : null}

			<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
				{metricCards.map((metric) => (
					<SectionCard
						key={metric.key}
						title={
							<Typography variant="overline" color="text.secondary" fontWeight={700}>
								{metric.title}
							</Typography>
						}
						action={
							<Box
								sx={(theme) => ({
									width: 32,
									height: 32,
									borderRadius: 1,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									color: theme.palette[metric.palette].main,
									backgroundColor: alpha(theme.palette[metric.palette].main, 0.2),
								})}
							>
								{metric.icon}
							</Box>
						}
						sx={{ flex: '1 1 240px' }}
					>
						<Typography variant="h4" fontWeight={700} color={`${metric.palette}.main`}>
							{metric.value}
						</Typography>
					</SectionCard>
				))}
			</Stack>

			<Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
				<GenderCard
					title="Masculino"
					percentual={percentualMasculino}
					color="info"
					icon={<ManOutlinedIcon fontSize="small" />}
				/>
				<GenderCard
					title="Feminino"
					percentual={percentualFeminino}
					color="success"
					icon={<WomanOutlinedIcon fontSize="small" />}
				/>
			</Stack>

			<SectionCard title="Filtros Analíticos">
				<Stack spacing={1.5}>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							select
							size="small"
							label="Ano CFO"
							value={filtroAno}
							onChange={(event) => setFiltroAno(event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{anosDisponiveis.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>

						<TextField
							select
							size="small"
							label="Curso CFO"
							value={filtroCurso}
							onChange={(event) => setFiltroCurso(event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{cursosDisponiveis.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>

						<TextField
							select
							size="small"
							label="Sexo"
							value={filtroSexo}
							onChange={(event) => setFiltroSexo(event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todos</MenuItem>
							{sexosDisponiveis.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>

						<TextField
							select
							size="small"
							label="Atividade"
							value={filtroAtividade}
							onChange={(event) => setFiltroAtividade(event.target.value)}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							<MenuItem value="">Todas (exceto Retorno/Pós operatório)</MenuItem>
							{atividadesDisponiveis.map((item) => (
								<MenuItem key={item} value={item}>{item}</MenuItem>
							))}
						</TextField>
					</Stack>

					<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1}>
						<Typography variant="body2" color="text.secondary">
							Filtro aplicado sobre atendimentos iniciais; atividades de retorno e pós-operatório são removidas.
						</Typography>
						<Typography variant="h6" color="primary.main" fontWeight={700}>
							Qtd atendimento: {totalFiltrado}
						</Typography>
					</Stack>
				</Stack>
			</SectionCard>

			<Stack direction={{ xs: 'column', xl: 'row' }} spacing={2}>
				<SectionCard title="Atendimentos nos últimos 6 meses" sx={{ flex: 2 }}>
					<Box sx={{ width: '100%', overflowX: 'auto', pb: 0.5 }}>
						<Stack
							direction="row"
							alignItems="flex-end"
							spacing={1}
							height={{ xs: 200, sm: 220 }}
							minWidth={{ xs: 360, sm: 0 }}
						>
							{painel.atendimentos_ultimos_6_meses.map((item) => {
								const alturaBarra = Math.max(12, (item.total / maiorVolumeMensal) * 150);
								return (
									<Stack
										key={item.mes}
										alignItems="center"
										justifyContent="flex-end"
										flex={1}
										spacing={0.5}
										sx={{ minWidth: { xs: 48, sm: 0 } }}
									>
										<Typography variant="caption" color="text.secondary">
											{item.total}
										</Typography>
										<Stack
											sx={{
												height: `${alturaBarra}px`,
												width: '100%',
												maxWidth: { xs: 42, sm: 52 },
												bgcolor: 'primary.main',
												borderRadius: 1,
											}}
										/>
										<Typography variant="caption">{item.mes}</Typography>
									</Stack>
								);
							})}
						</Stack>
					</Box>
				</SectionCard>

				<SectionCard title="Encaminhamentos" sx={{ flex: 1 }}>
					<Stack spacing={1.5}>
						{painel.encaminhamentos_por_perfil.map((item) => (
							<Stack key={item.perfil} spacing={0.5}>
								<Stack direction="row" justifyContent="space-between">
									<Typography variant="body2">{item.perfil}</Typography>
									<Typography variant="body2" color="text.secondary">
										{item.total} ({Math.round(item.percentual)}%)
									</Typography>
								</Stack>
								<LinearProgress
									variant="determinate"
									value={Math.min(item.percentual, 100)}
									sx={{ height: 8, borderRadius: 6 }}
								/>
							</Stack>
						))}
					</Stack>
				</SectionCard>
			</Stack>

			<Stack direction={{ xs: 'column', xl: 'row' }} spacing={2}>
				<SectionCard
					title="Mapa de calor: Ano CFO x Curso CFO (Atendimento Inicial)"
					subtitle={`Mín: ${heatmapMatrix.minPercentual.toFixed(1)}% • Máx: ${heatmapMatrix.maxPercentual.toFixed(1)}%`}
					sx={{ flex: 1.2 }}
				>
					{heatmapAnos.length === 0 || heatmapCursos.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							Sem dados para o cruzamento com os filtros atuais.
						</Typography>
					) : (
						<Stack spacing={1.25}>
							<TableContainer sx={{ maxHeight: 380 }}>
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell>Ano \ Curso</TableCell>
											{heatmapCursos.map((curso) => (
												<TableCell key={curso} align="center">{curso}</TableCell>
											))}
										</TableRow>
									</TableHead>
									<TableBody>
										{heatmapAnos.map((ano, rowIndex) => (
											<TableRow key={ano}>
												<TableCell sx={{ whiteSpace: 'nowrap' }}>{ano}</TableCell>
												{heatmapMatrix.matrix[rowIndex].map((cell) => {
													const escala =
														heatmapMatrix.maxPercentual > 0
															? cell.percentual / heatmapMatrix.maxPercentual
															: 0;

													return (
														<TableCell
															key={`${ano}-${cell.curso}`}
															align="center"
															sx={(theme) => ({
																backgroundColor:
																	cell.total === 0
																		? alpha(theme.palette.grey[500], 0.07)
																		: escala <= 0.25
																			? alpha(theme.palette.info.light, 0.45)
																			: escala <= 0.5
																				? alpha(theme.palette.info.main, 0.45)
																				: escala <= 0.75
																					? alpha(theme.palette.warning.main, 0.5)
																					: alpha(theme.palette.error.main, 0.55),
																fontWeight: cell.total > 0 ? 700 : 400,
																minWidth: 108,
															})}
														>
															{cell.percentual.toFixed(1)}% ({cell.total})
														</TableCell>
													);
												})}
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>

							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
								<Stack direction="row" spacing={0.5} alignItems="center">
									<Box sx={(theme) => ({ width: 18, height: 10, borderRadius: 0.75, backgroundColor: alpha(theme.palette.grey[500], 0.2) })} />
									<Typography variant="caption" color="text.secondary">0%</Typography>
								</Stack>
								<Stack direction="row" spacing={0.5} alignItems="center">
									<Box sx={(theme) => ({ width: 18, height: 10, borderRadius: 0.75, backgroundColor: alpha(theme.palette.info.light, 0.5) })} />
									<Typography variant="caption" color="text.secondary">Baixa</Typography>
								</Stack>
								<Stack direction="row" spacing={0.5} alignItems="center">
									<Box sx={(theme) => ({ width: 18, height: 10, borderRadius: 0.75, backgroundColor: alpha(theme.palette.info.main, 0.5) })} />
									<Typography variant="caption" color="text.secondary">Moderada</Typography>
								</Stack>
								<Stack direction="row" spacing={0.5} alignItems="center">
									<Box sx={(theme) => ({ width: 18, height: 10, borderRadius: 0.75, backgroundColor: alpha(theme.palette.warning.main, 0.55) })} />
									<Typography variant="caption" color="text.secondary">Alta</Typography>
								</Stack>
								<Stack direction="row" spacing={0.5} alignItems="center">
									<Box sx={(theme) => ({ width: 18, height: 10, borderRadius: 0.75, backgroundColor: alpha(theme.palette.error.main, 0.6) })} />
									<Typography variant="caption" color="text.secondary">Muito alta</Typography>
								</Stack>
							</Stack>
						</Stack>
					)}
				</SectionCard>

				<SectionCard title="Pareto: Atividade x Atendimento Inicial" sx={{ flex: 1 }}>
					{paretoData.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							Sem dados para construir o Pareto com os filtros atuais.
						</Typography>
					) : (
						<Box sx={{ width: '100%', overflowX: 'auto' }}>
							<svg width={paretoSvg.width} height={paretoSvg.height} role="img" aria-label="Gráfico de Pareto">
								<line x1="36" y1={paretoSvg.barBottom} x2={paretoSvg.width - 16} y2={paretoSvg.barBottom} stroke="#B0BEC5" />
								<line x1="36" y1={paretoSvg.barBottom - paretoSvg.barAreaHeight} x2="36" y2={paretoSvg.barBottom} stroke="#B0BEC5" />
								{paretoData.map((item, index) => {
									const x = 55 + index * 90;
									const barHeight = (item.total / paretoSvg.maxTotal) * paretoSvg.barAreaHeight;
									const y = paretoSvg.barBottom - barHeight;
									return (
										<g key={item.atividade}>
											<rect
												x={x}
												y={y}
												width={paretoSvg.barWidth}
												height={barHeight}
												rx="4"
												fill="#1976D2"
											/>
											<text x={x + paretoSvg.barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#37474F">
												{item.total}
											</text>
											<text x={x + paretoSvg.barWidth / 2} y={paretoSvg.barBottom + 16} textAnchor="middle" fontSize="10" fill="#455A64">
												{truncateLabel(item.atividade, 12)}
											</text>
										</g>
									);
								})}
								<polyline fill="none" stroke="#D32F2F" strokeWidth="2.5" points={paretoSvg.points} />
								{paretoData.map((item, index) => {
									const x = 55 + index * 90 + paretoSvg.barWidth / 2;
									const y = paretoSvg.barBottom - (item.acumuladoPercentual / 100) * paretoSvg.barAreaHeight;
									return (
										<g key={`${item.atividade}-line`}>
											<circle cx={x} cy={y} r="3.2" fill="#D32F2F" />
											<text x={x + 4} y={y - 6} fontSize="10" fill="#B71C1C">
												{item.acumuladoPercentual.toFixed(0)}%
											</text>
										</g>
									);
								})}
							</svg>
						</Box>
					)}
				</SectionCard>
			</Stack>
		</Stack>
	);
};

const truncateLabel = (value: string, maxLength: number): string => {
	if (value.length <= maxLength) {
		return value;
	}

	return `${value.slice(0, maxLength).trimEnd()}...`;
};

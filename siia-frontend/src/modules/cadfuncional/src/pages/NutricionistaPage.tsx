import { useMemo, useState } from 'react';

import {
	Alert,
	Button,
	Checkbox,
	Chip,
	CircularProgress,
	FormControlLabel,
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
import { EmptyState, SectionCard, useNotify } from '../design-system';
import { useAtendimentos } from '../hooks/useAtendimentos';
import { useAvaliacoesNutricionais, useCreateAvaliacaoNutricional } from '../hooks/useNutricao';
import { useMilitares } from '../hooks/usePessoal';
import type { Atendimento } from '../types/atendimento';
import type {
	AvaliacaoNutricional,
	CreateAvaliacaoNutricionalPayload,
	TecnicaPercentualGordura,
} from '../types/nutricao';

interface FormularioNutricionalState {
	pesoKg: string;
	alturaM: string;
	percentualGordura: string;
	tecnicaUtilizada: TecnicaPercentualGordura | '';
	dexaSolicitado: boolean;
	gastoIsotonicoHomem: string;
	gastoIsotonicoMulher: string;
	gastoCaloricoAtual: string;
	ingestaoHidricaAtual: string;
	tratamentoAjusteNutricional: string;
	tratamentoSuplementacao: string;
}

const tecnicaOptions: TecnicaPercentualGordura[] = ['3 dobras', '7 dobras', 'ultrassom', 'bioimpedância'];

const classificarImc = (imc: number): string => {
	if (imc < 18.5) return 'Abaixo do peso';
	if (imc < 25.0) return 'Peso normal';
	if (imc < 30.0) return 'Sobrepeso';
	return 'Obesidade';
};

const initialFormularioNutricional: FormularioNutricionalState = {
	pesoKg: '',
	alturaM: '',
	percentualGordura: '',
	tecnicaUtilizada: '',
	dexaSolicitado: false,
	gastoIsotonicoHomem: '',
	gastoIsotonicoMulher: '',
	gastoCaloricoAtual: '',
	ingestaoHidricaAtual: '',
	tratamentoAjusteNutricional: '',
	tratamentoSuplementacao: '',
};

const normalizeEncaminhamento = (value: string): string =>
	value
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.trim()
		.toLowerCase();

const ENCAMINHAMENTO_NUTRICAO_ALIASES = new Set([
	'nutricionista',
	'nutricao',
]);

const isEncaminhadoParaNutricao = (atendimento: Atendimento): boolean => {
	const encaminhamentos = atendimento.encaminhamentos_multidisciplinares ?? [];
	return encaminhamentos.some((item) => ENCAMINHAMENTO_NUTRICAO_ALIASES.has(normalizeEncaminhamento(item)));
};

const formatDate = (value: string) => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('pt-BR');
};

const classificarRelevancia = (atendimento: Atendimento): string | null => {
	const texto = [
		atendimento.notas_clinicas,
		atendimento.estrutura_anatomica,
		atendimento.localizacao_lesao,
	]
		.join(' ')
		.toLowerCase();
	if (/anemia|ferro|hemoglobina/i.test(texto)) return 'Anemia nutricional';
	if (/desnutri|baixo peso|imc/i.test(texto)) return 'Risco nutricional';
	if (atendimento.flag_sred && atendimento.tipo_lesao === 'Óssea') return 'Suporte metabólico ósseo';
	return null;
};

const colunaSecundariaSx = { display: { xs: 'none', sm: 'table-cell' } };

export const NutricionistaPage = () => {
	const notify = useNotify();
	const navigate = useNavigate();
	const { data, isLoading, isError, refetch } = useAtendimentos();
	const {
		data: avaliacoesNutricionais,
		isLoading: isLoadingAvaliacoesNutricionais,
		refetch: refetchAvaliacoesNutricionais,
	} = useAvaliacoesNutricionais();
	const { data: militares } = useMilitares();
	const createAvaliacaoMutation = useCreateAvaliacaoNutricional();
	const [busca, setBusca] = useState('');
	const [apenasRelevantes, setApenasRelevantes] = useState(false);
	const [formulario, setFormulario] = useState<FormularioNutricionalState>(initialFormularioNutricional);
	const [atendimentoSelecionado, setAtendimentoSelecionado] = useState<Atendimento | null>(null);
	const [avaliacaoCarregadaId, setAvaliacaoCarregadaId] = useState<number | null>(null);

	const militarById = useMemo(() => {
		const map = new Map<number, string>();
		for (const item of militares ?? []) {
			map.set(item.id, item.nome_completo);
		}
		return map;
	}, [militares]);

	const postoById = useMemo(() => {
		const map = new Map<number, string>();
		for (const item of militares ?? []) {
			map.set(item.id, item.posto_graduacao);
		}
		return map;
	}, [militares]);

	const pesoNumerico = Number.parseFloat(formulario.pesoKg.replace(',', '.'));
	const alturaNumerica = Number.parseFloat(formulario.alturaM.replace(',', '.'));
	const imcCalculado =
		Number.isFinite(pesoNumerico) && pesoNumerico > 0 &&
		Number.isFinite(alturaNumerica) && alturaNumerica > 0
			? pesoNumerico / (alturaNumerica * alturaNumerica)
			: null;
	const ingestaoLiquidaIdealMl = Number.isFinite(pesoNumerico) && pesoNumerico > 0
		? Math.round(35 * pesoNumerico)
		: 0;

	const handleSalvarAvaliacao = async () => {
		if (!atendimentoSelecionado) {
			notify('Selecione um atendimento/paciente em "Atendimentos — Nutrição" antes de salvar.', 'warning');
			return;
		}

		if (!formulario.percentualGordura || !formulario.tecnicaUtilizada) {
			notify('Preencha Percentual de Gordura e Técnica Utilizada.', 'warning');
			return;
		}

		const gastoHomem = Number.parseInt(formulario.gastoIsotonicoHomem, 10);
		const gastoMulher = Number.parseInt(formulario.gastoIsotonicoMulher, 10);
		const peso = Number.parseFloat(formulario.pesoKg.replace(',', '.'));
		const gastoAtual = Number.parseInt(formulario.gastoCaloricoAtual, 10);
		const ingestaoAtual = Number.parseInt(formulario.ingestaoHidricaAtual, 10);

		if (
			!Number.isFinite(gastoHomem) ||
			!Number.isFinite(gastoMulher) ||
			!Number.isFinite(peso) ||
			!Number.isFinite(gastoAtual) ||
			!Number.isFinite(ingestaoAtual)
		) {
			notify('Preencha os campos numéricos obrigatórios com valores válidos.', 'warning');
			return;
		}

		const payload: CreateAvaliacaoNutricionalPayload = {
			atendimento_id: atendimentoSelecionado.id,
			percentual_gordura: Number.parseFloat(formulario.percentualGordura.replace(',', '.')),
			tecnica_utilizada: formulario.tecnicaUtilizada,
			dexa_solicitado: formulario.dexaSolicitado,
			gasto_isotonico_estimado_homem: gastoHomem,
			gasto_isotonico_estimado_mulher: gastoMulher,
			peso_kg: peso,
			gasto_calorico_atual: gastoAtual,
			ingestao_hidrica_atual: ingestaoAtual,
			tratamento_ajuste_nutricional: formulario.tratamentoAjusteNutricional,
			tratamento_suplementacao: formulario.tratamentoSuplementacao,
		};

		try {
			await createAvaliacaoMutation.mutateAsync(payload);
			notify('Avaliação nutricional salva com sucesso.', 'success');
			setFormulario(initialFormularioNutricional);
			setAtendimentoSelecionado(null);
			setAvaliacaoCarregadaId(null);
		} catch {
			notify('Não foi possível salvar a avaliação nutricional.', 'error');
		}
	};

	const atendimentos = useMemo(() => {
		const lista = (data ?? []).filter(isEncaminhadoParaNutricao);
		const buscaNorm = busca.trim().toLowerCase();

		return lista.filter((item) => {
			if (apenasRelevantes && !classificarRelevancia(item)) return false;

			if (buscaNorm) {
				const texto = [item.estrutura_anatomica, item.notas_clinicas]
					.join(' ')
					.toLowerCase();
				if (!texto.includes(buscaNorm)) return false;
			}
			return true;
		});
	}, [data, busca, apenasRelevantes]);

	const atendimentoById = useMemo(() => {
		const map = new Map<number, Atendimento>();
		for (const item of data ?? []) {
			map.set(item.id, item);
		}
		return map;
	}, [data]);

	const historicoAvaliacoes = useMemo(() => {
		const lista = avaliacoesNutricionais ?? [];
		if (!atendimentoSelecionado) {
			return lista;
		}

		return lista.filter((item) => item.cadete_id === atendimentoSelecionado.cadete_id);
	}, [avaliacoesNutricionais, atendimentoSelecionado]);

	const handleCarregarAvaliacaoNoFormulario = (avaliacao: AvaliacaoNutricional) => {
		setAvaliacaoCarregadaId(avaliacao.id);
		setFormulario({
			pesoKg: String(avaliacao.peso_kg),
			alturaM: '',
			percentualGordura: String(avaliacao.percentual_gordura),
			tecnicaUtilizada: avaliacao.tecnica_utilizada,
			dexaSolicitado: avaliacao.dexa_solicitado,
			gastoIsotonicoHomem: String(avaliacao.gasto_isotonico_estimado_homem),
			gastoIsotonicoMulher: String(avaliacao.gasto_isotonico_estimado_mulher),
			gastoCaloricoAtual: String(avaliacao.gasto_calorico_atual),
			ingestaoHidricaAtual: String(avaliacao.ingestao_hidrica_atual),
			tratamentoAjusteNutricional: avaliacao.tratamento_ajuste_nutricional,
			tratamentoSuplementacao: avaliacao.tratamento_suplementacao,
		});

		const atendimento = atendimentoById.get(avaliacao.atendimento_id);
		if (atendimento) {
			setAtendimentoSelecionado(atendimento);
			notify('Avaliação carregada no formulário.', 'success');
			return;
		}

		setAtendimentoSelecionado(null);
		notify('Avaliação carregada, mas o atendimento original não está disponível na listagem atual.', 'warning');
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
			<SectionCard title="Nutricionista — Módulo Metabólico">
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
				Módulo Nutricionista — Monitoramento Metabólico e Ósseo
			</Typography>

			<Alert severity="info" variant="outlined">
				Triagem nutricional baseada em conteúdo clínico das notas e contexto da lesão.
			</Alert>

			<SectionCard title="Filtros">
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} mb={1}>
					<TextField
						label="Buscar"
						placeholder="Estrutura, notas…"
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

			<SectionCard title="Atendimentos — Nutrição">
				{atendimentos.length === 0 ? (
					<EmptyState
						title="Nenhum atendimento encontrado"
						description="Ajuste os filtros ou aguarde novos registros."
					/>
				) : (
					<TableContainer>
						<Table size="small">
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
								{atendimentos.map((atd) => {
									const selecionado = atendimentoSelecionado?.id === atd.id;
									return (
										<TableRow key={atd.id}>
											<TableCell>#{atd.id}</TableCell>
											<TableCell sx={colunaSecundariaSx}>{postoById.get(atd.cadete_id) || 'Aluno(a) ou Cadete'}</TableCell>
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
													onClick={() => navigate(`/nutricao/atendimento/${atd.id}/detalhes`)}
													sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
												>
													Detalhes
												</Button>
											</TableCell>
											<TableCell>
												<Button
													variant={selecionado ? 'contained' : 'outlined'}
													size="small"
													onClick={() => setAtendimentoSelecionado(atd)}
													sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
												>
													{selecionado ? 'Vinculado' : 'Vincular formulário'}
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

			<SectionCard
				title="Formulário Nutricional"
				subtitle="Registro de composição corporal, estimativas metabólicas, hidratação e plano terapêutico."
			>
				<Stack spacing={1.5}>
					<Alert severity={atendimentoSelecionado ? 'success' : 'warning'} variant="outlined">
						{atendimentoSelecionado
							? `Paciente vinculado: ${militarById.get(atendimentoSelecionado.cadete_id) ?? `Cadete #${atendimentoSelecionado.cadete_id}`} (Atendimento #${atendimentoSelecionado.id})`
							: 'Nenhum paciente vinculado. Na tabela "Atendimentos — Nutrição", clique em "Vincular formulário".'}
					</Alert>
					{/* --- Antropometria e IMC --- */}
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Peso [Kg]"
							type="number"
							value={formulario.pesoKg}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									pesoKg: event.target.value,
								}))
							}
							inputProps={{ min: 0, step: 0.1 }}
							helperText="Peso corporal em quilogramas."
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							label="Altura [metros]"
							type="number"
							value={formulario.alturaM}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									alturaM: event.target.value,
								}))
							}
							inputProps={{ min: 0, step: 0.01 }}
							helperText="Ex.: 1.75"
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							label="IMC [kg/m²]"
							value={imcCalculado !== null ? imcCalculado.toFixed(2) : ''}
							InputProps={{ readOnly: true }}
							helperText={
								imcCalculado !== null
									? `${classificarImc(imcCalculado)} · <18,5 Baixo | 18,5–24,9 Normal | 25–29,9 Sobrepeso | ≥30 Obesidade`
									: 'Calculado automaticamente (Peso ÷ Altura²).'
							}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>
					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Percentual de Gordura (%)"
							type="number"
							value={formulario.percentualGordura}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									percentualGordura: event.target.value,
								}))
							}
							inputProps={{ min: 0, max: 100, step: 0.1 }}
							helperText="Informe o valor percentual (%)."
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							select
							label="Técnica Utilizada"
							value={formulario.tecnicaUtilizada}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									tecnicaUtilizada: event.target.value as TecnicaPercentualGordura,
								}))
							}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							{tecnicaOptions.map((item) => (
								<MenuItem key={item} value={item}>
									{item}
								</MenuItem>
							))}
						</TextField>

						<Stack justifyContent="center">
							<FormControlLabel
								control={
									<Checkbox
										checked={formulario.dexaSolicitado}
										onChange={(event) =>
											setFormulario((current) => ({
												...current,
												dexaSolicitado: event.target.checked,
											}))
										}
									/>
								}
								label="DEXA"
							/>
						</Stack>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Gasto Isotônico Estimado — Homem"
							type="number"
							value={formulario.gastoIsotonicoHomem}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									gastoIsotonicoHomem: event.target.value,
								}))
							}
							inputProps={{ min: 0, step: 1 }}
							helperText="Número inteiro (kcal)."
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							label="Gasto Isotônico Estimado — Mulher"
							type="number"
							value={formulario.gastoIsotonicoMulher}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									gastoIsotonicoMulher: event.target.value,
								}))
							}
							inputProps={{ min: 0, step: 1 }}
							helperText="Número inteiro (kcal)."
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Ingestão Líquida Ideal (ml)"
							value={ingestaoLiquidaIdealMl > 0 ? String(ingestaoLiquidaIdealMl) : ''}
							InputProps={{ readOnly: true }}
							helperText="Cálculo automático: 35 x peso (kg)."
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Gasto Calórico Atual"
							type="number"
							value={formulario.gastoCaloricoAtual}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									gastoCaloricoAtual: event.target.value,
								}))
							}
							inputProps={{ min: 0, step: 1 }}
							helperText="Número inteiro (kcal)."
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							label="Ingestão Hídrica Atual"
							type="number"
							value={formulario.ingestaoHidricaAtual}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									ingestaoHidricaAtual: event.target.value,
								}))
							}
							inputProps={{ min: 0, step: 1 }}
							helperText="Número inteiro (ml)."
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
						<TextField
							label="Tratamento — Ajuste Nutricional"
							value={formulario.tratamentoAjusteNutricional}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									tratamentoAjusteNutricional: event.target.value.slice(0, 200),
								}))
							}
							inputProps={{ maxLength: 200 }}
							helperText={`${formulario.tratamentoAjusteNutricional.length}/200`}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>

						<TextField
							label="Tratamento — Suplementação"
							value={formulario.tratamentoSuplementacao}
							onChange={(event) =>
								setFormulario((current) => ({
									...current,
									tratamentoSuplementacao: event.target.value.slice(0, 200),
								}))
							}
							inputProps={{ maxLength: 200 }}
							helperText={`${formulario.tratamentoSuplementacao.length}/200`}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						/>
					</Stack>

					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<Button
							variant="contained"
							onClick={() => {
								void handleSalvarAvaliacao();
							}}
							disabled={createAvaliacaoMutation.isPending}
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							{createAvaliacaoMutation.isPending ? 'Salvando...' : 'Salvar avaliação'}
						</Button>
						<Button
							variant="outlined"
							onClick={() => {
								setFormulario(initialFormularioNutricional);
								setAtendimentoSelecionado(null);
							}}
							disabled={createAvaliacaoMutation.isPending}
							sx={{ minHeight: 44, minWidth: 44 }}
						>
							Limpar formulário
						</Button>
					</Stack>
				</Stack>
			</SectionCard>

			<SectionCard
				title="Histórico Nutricional"
				subtitle={
					atendimentoSelecionado
						? `Mostrando histórico do paciente vinculado: ${militarById.get(atendimentoSelecionado.cadete_id) ?? `Cadete #${atendimentoSelecionado.cadete_id}`}.`
						: 'Mostrando histórico geral. Vincule um paciente para filtrar por cadete/aluno.'
				}
			>
				{isLoadingAvaliacoesNutricionais ? (
					<Stack alignItems="center" justifyContent="center" py={3}>
						<CircularProgress size={26} />
					</Stack>
				) : historicoAvaliacoes.length === 0 ? (
					<EmptyState
						title="Sem avaliações no histórico"
						description="Nenhuma avaliação nutricional registrada para o filtro atual."
						action={<Button onClick={() => void refetchAvaliacoesNutricionais()}>Atualizar histórico</Button>}
					/>
				) : (
					<TableContainer sx={{ overflowX: 'auto' }}>
						<Table size="small" sx={{ minWidth: 980, '& th': { whiteSpace: 'nowrap' } }}>
							<TableHead>
								<TableRow>
									<TableCell>Data</TableCell>
									<TableCell>Paciente</TableCell>
									<TableCell>Atendimento</TableCell>
									<TableCell>% Gordura</TableCell>
									<TableCell>Técnica</TableCell>
									<TableCell>Ingestão Ideal (ml)</TableCell>
									<TableCell>DEXA</TableCell>
									<TableCell>Ação</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{historicoAvaliacoes.map((item) => (
									<TableRow
										key={item.id}
										hover
										selected={avaliacaoCarregadaId === item.id}
									>
										<TableCell>{formatDate(item.criado_em)}</TableCell>
										<TableCell>{militarById.get(item.cadete_id) ?? `Cadete #${item.cadete_id}`}</TableCell>
										<TableCell>#{item.atendimento_id}</TableCell>
										<TableCell>{item.percentual_gordura}%</TableCell>
										<TableCell>{item.tecnica_utilizada}</TableCell>
										<TableCell>{item.ingestao_liquida_ideal_ml}</TableCell>
										<TableCell>
											{item.dexa_solicitado ? 'Sim' : 'Não'}
											{avaliacaoCarregadaId === item.id ? (
												<Chip label="Carregada" color="success" size="small" sx={{ ml: 1 }} />
											) : null}
										</TableCell>
										<TableCell>
											<Button
												variant="outlined"
												size="small"
												onClick={() => handleCarregarAvaliacaoNoFormulario(item)}
													sx={{ minHeight: 44, minWidth: 44, whiteSpace: 'nowrap' }}
											>
												Carregar no formulário
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

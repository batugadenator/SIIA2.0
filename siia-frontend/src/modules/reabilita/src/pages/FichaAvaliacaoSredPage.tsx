import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import {
	Alert,
	Button,
	Chip,
	Checkbox,
	CircularProgress,
	Divider,
	FormControlLabel,
	MenuItem,
	Slider,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { EmptyState, SectionCard, useNotify } from '../design-system';
import {
	useAvaliacoesFisioterapiaSRED,
	useCreateAvaliacaoFisioterapiaSRED,
	useUpdateAvaliacaoFisioterapiaSRED,
} from '../hooks/useAtendimentos';
import { useAtendimentos } from '../hooks/useAtendimentos';
import { useProfissionaisSaude } from '../hooks/usePessoal';
import type {
	AvaliacaoFisioterapiaSRED,
	CreateAvaliacaoFisioterapiaSREDPayload,
	EtiologiaSRED,
	ReatividadeSRED,
} from '../types/atendimento';

// ---------------------------------------------------------------------------
// Constantes (mirror das choices Django – fonte de verdade: backend)
// ---------------------------------------------------------------------------
const REATIVIDADE_OPTIONS: { value: ReatividadeSRED; label: string; color: 'success' | 'warning' | 'error' }[] = [
	{ value: 'Baixa', label: 'Baixa — dor só no final da ADM / passa rápido', color: 'success' },
	{ value: 'Moderada', label: 'Moderada — dor no meio da ADM / demora a passar', color: 'warning' },
	{ value: 'Alta', label: 'Alta — dor ao repouso / demora horas para aliviar', color: 'error' },
];

const ETIOLOGIA_OPTIONS: EtiologiaSRED[] = [
	'Traumática',
	'Degenerativa',
	'Sobrecarga (Overuse)',
	'Pós-operatória',
	'Idiopática',
];

const EVA_MARKS = [0, 2, 4, 6, 8, 10].map((v) => ({ value: v, label: String(v) }));

type FormState = Omit<CreateAvaliacaoFisioterapiaSREDPayload, 'atendimento_id' | 'fisioterapeuta_id'>;

const EMPTY_FORM: FormState = {
	gravidade_eva: 0,
	limitacao_funcional: '',
	sinais_vermelhos: '',
	reatividade: 'Baixa',
	etiologia: 'Traumática',
	etiologia_complemento: '',
	diagnostico_clinico: '',
	inspecao_palpacao: '',
	adm_ativa_graus: '',
	adm_passiva_graus: '',
	teste_forca: '',
	testes_especificos: '',
	objetivos_tratamento: '',
	plano_tratamento: '',
	liberado_para_pef: false,
	observacoes_liberacao_pef: '',
};

const getConductaHint = (reatividade: ReatividadeSRED): string => {
	switch (reatividade) {
		case 'Alta':
			return '⚠ Reatividade Alta: priorizar condutas analgésicas, repouso relativo e crioterapia antes de carga progressiva.';
		case 'Moderada':
			return 'Reatividade Moderada: equilibrar analgesia e fortalecimento gradual. Respeitar limiar de dor durante exercícios.';
		case 'Baixa':
			return 'Reatividade Baixa: foco em fortalecimento excêntrico, ganho de ADM e retorno esportivo/laboral progressivo.';
	}
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export const FichaAvaliacaoSredPage = () => {
	const { atendimentoId: atendimentoIdParam } = useParams<{ atendimentoId: string }>();
	const atendimentoId = Number(atendimentoIdParam);
	const navigate = useNavigate();
	const notify = useNotify();

	const { data: atendimentos } = useAtendimentos();
	const { data: profissionais } = useProfissionaisSaude();
	const { data: avaliacoes, isLoading: isLoadingList } = useAvaliacoesFisioterapiaSRED(atendimentoId);
	const createMutation = useCreateAvaliacaoFisioterapiaSRED();

	// The most recent evaluation for this atendimento (if any)
	const existing: AvaliacaoFisioterapiaSRED | undefined = avaliacoes?.[0];
	const updateMutation = useUpdateAvaliacaoFisioterapiaSRED(existing?.id ?? 0);

	const atendimento = atendimentos?.find((a) => a.id === atendimentoId);

	// Resolve the logged-in user's ProfissionalSaude id
	const meuPerfil = profissionais?.find(
		(p) => p.especialidade === 'Fisioterapeuta',
	);

	const [form, setForm] = useState<FormState>(EMPTY_FORM);
	const [fisioterapeutaId, setFisioterapeutaId] = useState<number | ''>('');

	// Pre-populate form when an existing evaluation is loaded
	useEffect(() => {
		if (existing) {
			setForm({
				gravidade_eva: existing.gravidade_eva,
				limitacao_funcional: existing.limitacao_funcional,
				sinais_vermelhos: existing.sinais_vermelhos,
				reatividade: existing.reatividade,
				etiologia: existing.etiologia,
				etiologia_complemento: existing.etiologia_complemento,
				diagnostico_clinico: existing.diagnostico_clinico,
				inspecao_palpacao: existing.inspecao_palpacao,
				adm_ativa_graus: existing.adm_ativa_graus,
				adm_passiva_graus: existing.adm_passiva_graus,
				teste_forca: existing.teste_forca,
				testes_especificos: existing.testes_especificos,
				objetivos_tratamento: existing.objetivos_tratamento,
				plano_tratamento: existing.plano_tratamento,
				liberado_para_pef: existing.liberado_para_pef,
				observacoes_liberacao_pef: existing.observacoes_liberacao_pef,
			});
			setFisioterapeutaId(existing.fisioterapeuta_id);
		} else if (meuPerfil) {
			setFisioterapeutaId(meuPerfil.id);
		}
	}, [existing, meuPerfil]);

	// Pre-fill diagnosis from atendimento data
	useEffect(() => {
		if (atendimento && !existing) {
			setForm((prev) => ({
				...prev,
				diagnostico_clinico: [
					atendimento.tipo_lesao,
					atendimento.estrutura_anatomica,
					atendimento.localizacao_lesao,
				]
					.filter(Boolean)
					.join(' — '),
			}));
		}
	}, [atendimento, existing]);

	if (!Number.isFinite(atendimentoId) || atendimentoId <= 0) {
		return (
			<EmptyState
				title="Atendimento inválido"
				description="Acesse esta ficha a partir da lista de atendimentos de fisioterapia."
			/>
		);
	}

	if (isLoadingList) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="45vh">
				<CircularProgress />
			</Stack>
		);
	}

	const txt =
		(field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
			setForm((prev) => ({ ...prev, [field]: e.target.value }));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!fisioterapeutaId) {
			notify('Selecione o fisioterapeuta responsável.', 'error');
			return;
		}
		const payload: CreateAvaliacaoFisioterapiaSREDPayload = {
			atendimento_id: atendimentoId,
			fisioterapeuta_id: fisioterapeutaId as number,
			...form,
		};
		if (existing) {
			updateMutation.mutate(payload, {
				onSuccess: () => {
					notify('Avaliação atualizada com sucesso.', 'success');
				},
				onError: () => {
					notify('Erro ao atualizar avaliação.', 'error');
				},
			});
		} else {
			createMutation.mutate(payload, {
				onSuccess: () => {
					notify('Ficha criada com sucesso.', 'success');
				},
				onError: () => {
					notify('Erro ao salvar ficha.', 'error');
				},
			});
		}
	};

	const isSaving = createMutation.isPending || updateMutation.isPending;
	const reatividade = form.reatividade;

	return (
		<Stack spacing={3} p={2} component="form" onSubmit={handleSubmit}>
			{/* Header */}
			<Stack
				direction={{ xs: 'column', sm: 'row' }}
				justifyContent="space-between"
				alignItems={{ sm: 'center' }}
				spacing={1.5}
			>
				<Stack spacing={0.5}>
					<Stack direction="row" spacing={1} alignItems="center">
						<AssignmentOutlinedIcon color="primary" />
						<Typography variant="h5" fontWeight={600}>
							Ficha de Avaliação Fisioterapêutica — S-RED
						</Typography>
					</Stack>
					{atendimento && (
						<Typography variant="body2" color="text.secondary">
							Atendimento #{atendimento.id} · {atendimento.estrutura_anatomica || atendimento.tipo_lesao}
							{atendimento.lateralidade ? ` · ${atendimento.lateralidade}` : ''}
						</Typography>
					)}
				</Stack>
				<Stack direction="row" spacing={1.5}>
					<Button variant="outlined" onClick={() => navigate(-1)} sx={{ minHeight: 44 }}>
						Voltar
					</Button>
					<Button
						type="submit"
						variant="contained"
						startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
						disabled={isSaving}
						sx={{ minHeight: 44 }}
					>
						{isSaving ? 'Salvando…' : existing ? 'Atualizar' : 'Salvar ficha'}
					</Button>
				</Stack>
			</Stack>

			{/* Fisioterapeuta */}
			<SectionCard title="Fisioterapeuta Responsável">
				<TextField
					select
					label="Fisioterapeuta"
					value={fisioterapeutaId}
					onChange={(e) => setFisioterapeutaId(Number(e.target.value))}
					required
					fullWidth
					sx={{ maxWidth: 400 }}
				>
					{(profissionais ?? [])
						.filter((p) => p.especialidade === 'Fisioterapeuta')
						.map((p) => (
							<MenuItem key={p.id} value={p.id}>
								#{p.id} — {p.especialidade}
							</MenuItem>
						))}
				</TextField>
			</SectionCard>

			<SectionCard title="Governança de Transição para PEF">
				<Stack spacing={1.25}>
					<FormControlLabel
						control={
							<Checkbox
								checked={Boolean(form.liberado_para_pef)}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										liberado_para_pef: event.target.checked,
									}))
								}
							/>
						}
						label="Liberado para transição ao Profissional de Educação Física"
					/>
					<TextField
						label="Observações da liberação"
						placeholder="Ex.: Reatividade baixa sustentada por 7 dias, apto para progressão de carga moderada."
						value={form.observacoes_liberacao_pef || ''}
						onChange={txt('observacoes_liberacao_pef')}
						multiline
						rows={2}
						fullWidth
					/>
					{existing?.liberado_para_pef_em ? (
						<Typography variant="caption" color="text.secondary">
							Liberação registrada em {new Date(existing.liberado_para_pef_em).toLocaleString('pt-BR')}
							{existing.liberado_para_pef_por_username ? ` por ${existing.liberado_para_pef_por_username}` : ''}.
						</Typography>
					) : null}
				</Stack>
			</SectionCard>

			<Divider />

			{/* S — Severity */}
			<SectionCard title="S — Severity (Gravidade)">
				<Stack spacing={3}>
					<Stack spacing={1}>
						<Typography variant="body2" color="text.secondary">
							EVA — Escala Visual Analógica de dor (0 = sem dor · 10 = pior dor imaginável)
						</Typography>
						<Stack direction="row" spacing={2} alignItems="center">
							<Slider
								value={form.gravidade_eva}
								onChange={(_, v) => setForm((prev) => ({ ...prev, gravidade_eva: v as number }))}
								min={0}
								max={10}
								step={1}
								marks={EVA_MARKS}
								valueLabelDisplay="on"
								sx={{ flex: 1, maxWidth: 420 }}
							/>
							<Chip
								label={`EVA ${form.gravidade_eva}/10`}
								color={
									form.gravidade_eva <= 3
										? 'success'
										: form.gravidade_eva <= 6
											? 'warning'
											: 'error'
								}
								variant="outlined"
							/>
						</Stack>
					</Stack>

					<TextField
						label="Limitação Funcional"
						placeholder="Ex.: Não consegue subir escadas, dificuldade ao agachar."
						value={form.limitacao_funcional}
						onChange={txt('limitacao_funcional')}
						multiline
						rows={2}
						fullWidth
					/>

					<TextField
						label="Sinais Vermelhos (Red Flags)"
						placeholder="Ex.: Perda de força súbita, parestesia, déficit neurológico."
						value={form.sinais_vermelhos}
						onChange={txt('sinais_vermelhos')}
						multiline
						rows={2}
						fullWidth
						InputProps={{
							startAdornment: form.sinais_vermelhos ? (
								<Tooltip title="Sinais vermelhos registrados — avaliar com atenção">
									<WarningAmberOutlinedIcon color="error" sx={{ mr: 1 }} />
								</Tooltip>
							) : undefined,
						}}
					/>
				</Stack>
			</SectionCard>

			<Divider />

			{/* R — Reactivity */}
			<SectionCard title="R — Reactivity (Irritabilidade)">
				<Stack spacing={2}>
					<TextField
						select
						label="Nível de Reatividade"
						value={form.reatividade}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, reatividade: e.target.value as ReatividadeSRED }))
						}
						required
						fullWidth
						sx={{ maxWidth: 500 }}
					>
						{REATIVIDADE_OPTIONS.map((opt) => (
							<MenuItem key={opt.value} value={opt.value}>
								{opt.label}
							</MenuItem>
						))}
					</TextField>
					<Alert
						severity={
							reatividade === 'Alta' ? 'error' : reatividade === 'Moderada' ? 'warning' : 'success'
						}
						variant="outlined"
						icon={false}
					>
						<Typography variant="body2">{getConductaHint(reatividade)}</Typography>
					</Alert>
				</Stack>
			</SectionCard>

			<Divider />

			{/* E — Etiology */}
			<SectionCard title="E — Etiology (Etiologia)">
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<TextField
						select
						label="Categoria Etiológica"
						value={form.etiologia}
						onChange={(e) =>
							setForm((prev) => ({ ...prev, etiologia: e.target.value as EtiologiaSRED }))
						}
						required
						fullWidth
					>
						{ETIOLOGIA_OPTIONS.map((opt) => (
							<MenuItem key={opt} value={opt}>
								{opt}
							</MenuItem>
						))}
					</TextField>
					<TextField
						label="Complemento (mecanismo)"
						placeholder="Ex.: erro de treinamento, queda de altura, desgaste por postura."
						value={form.etiologia_complemento}
						onChange={txt('etiologia_complemento')}
						fullWidth
						inputProps={{ maxLength: 255 }}
					/>
				</Stack>
			</SectionCard>

			<Divider />

			{/* D — Diagnosis */}
			<SectionCard title="D — Diagnosis (Diagnóstico Ortopédico)">
				<TextField
					label="Diagnóstico Clínico"
					placeholder="Ex.: Tendinopatia do manguito rotador; Hérnia de disco L4-L5."
					value={form.diagnostico_clinico}
					onChange={txt('diagnostico_clinico')}
					multiline
					rows={2}
					fullWidth
					required
					helperText="Diagnóstico estrutural fornecido pelo médico ortopedista."
				/>
			</SectionCard>

			<Divider />

			{/* Exame Físico */}
			<SectionCard title="Exame Físico Fisioterapêutico">
				<Stack spacing={2}>
					<TextField
						label="Inspeção e Palpação"
						placeholder="Edemas, desalinhamentos posturais, pontos-gatilho."
						value={form.inspecao_palpacao}
						onChange={txt('inspecao_palpacao')}
						multiline
						rows={2}
						fullWidth
					/>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
						<TextField
							label="ADM Ativa (graus / descritivo)"
							placeholder="Ex.: Flexão 120°, Abdução 90°"
							value={form.adm_ativa_graus}
							onChange={txt('adm_ativa_graus')}
							fullWidth
							inputProps={{ maxLength: 120 }}
						/>
						<TextField
							label="ADM Passiva (graus / descritivo)"
							placeholder="Ex.: Flexão 140°, Abdução 110°"
							value={form.adm_passiva_graus}
							onChange={txt('adm_passiva_graus')}
							fullWidth
							inputProps={{ maxLength: 120 }}
						/>
					</Stack>
					<TextField
						label="Teste de Força"
						placeholder="Ex.: Grau 4/5 KMB, rotação externa enfraquecida."
						value={form.teste_forca}
						onChange={txt('teste_forca')}
						fullWidth
						inputProps={{ maxLength: 120 }}
					/>
					<TextField
						label="Testes Específicos"
						placeholder="Ex.: Teste de Neer +, Arc doloroso +, Lachman –."
						value={form.testes_especificos}
						onChange={txt('testes_especificos')}
						multiline
						rows={2}
						fullWidth
					/>
				</Stack>
			</SectionCard>

			<Divider />

			{/* Plano terapêutico */}
			<SectionCard title="Objetivos e Plano de Tratamento">
				<Stack spacing={2}>
					<TextField
						label="Objetivos"
						placeholder="Ex.: Controle álgico, recuperação da ADM, fortalecimento excêntrico."
						value={form.objetivos_tratamento}
						onChange={txt('objetivos_tratamento')}
						multiline
						rows={2}
						fullWidth
					/>
					<TextField
						label="Plano de Tratamento"
						placeholder="TENS, crioterapia, exercícios de Codman, fortalecimento progressivo."
						value={form.plano_tratamento}
						onChange={txt('plano_tratamento')}
						multiline
						rows={3}
						fullWidth
					/>
				</Stack>
			</SectionCard>

			{/* Bottom save */}
			<Stack direction="row" justifyContent="flex-end" pb={2}>
				<Button
					type="submit"
					variant="contained"
					startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
					disabled={isSaving}
					sx={{ minHeight: 44, minWidth: 160 }}
				>
					{isSaving ? 'Salvando…' : existing ? 'Atualizar ficha' : 'Salvar ficha'}
				</Button>
			</Stack>
		</Stack>
	);
};

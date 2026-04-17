import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from '@mui/material';

import { SectionCard } from '../../design-system';
import type {
	DecisaoSredForm,
	LateralidadeForm,
	NovoAtendimentoFormState,
	OrigemLesaoForm,
	TipoAtendimentoForm,
	TipoLesaoForm,
} from '../../hooks/useNovoAtendimentoProcess';
import type { Lateralidade } from '../../types/atendimento';
import type { Militar, ProfissionalSaude } from '../../types/pessoal';

interface NovoAtendimentoStepPanelsProps {
	currentStep: number;
	formData: NovoAtendimentoFormState;
	setFormData: React.Dispatch<React.SetStateAction<NovoAtendimentoFormState>>;
	cadeteNrMilitar: string;
	setCadeteNrMilitar: React.Dispatch<React.SetStateAction<string>>;
	carimboData: string;
	carimboHora: string;
	militares?: Militar[];
	medicos: ProfissionalSaude[];
	tipoAtendimentoOptions: string[];
	tipoLesaoOptions: string[];
	origemLesaoOptions: string[];
	decisaoSredOptions: string[];
	segmentoOptions: string[];
	estruturaOptions: string[];
	localizacaoSelectOptions: string[];
	classificacaoAtividadeOptions: string[];
	tipoAtividadeOptions: string[];
	tfmTafOptions: string[];
	modalidadeOptions: string[];
	condutaOptions: string[];
	examesComplementaresOptions: string[];
	encaminhamentoOptions: string[];
	disposicaoOptions: string[];
	exigeDecisaoSred: boolean;
	tipoAtividadeEhTfmTaf: boolean;
	origemLesaoHabilitada: boolean;
	inferLateralidade: (segmento: string, estrutura: string) => Lateralidade;
	toggleListOption: (
		field: 'exames_complementares' | 'encaminhamentos_multidisciplinares' | 'disposicao_cadete',
		option: string,
		checked: boolean,
	) => void;
}

export const NovoAtendimentoStepPanels = ({
	currentStep,
	formData,
	setFormData,
	cadeteNrMilitar,
	setCadeteNrMilitar,
	carimboData,
	carimboHora,
	militares,
	medicos,
	tipoAtendimentoOptions,
	tipoLesaoOptions,
	origemLesaoOptions,
	decisaoSredOptions,
	segmentoOptions,
	estruturaOptions,
	localizacaoSelectOptions,
	classificacaoAtividadeOptions,
	tipoAtividadeOptions,
	tfmTafOptions,
	modalidadeOptions,
	condutaOptions,
	examesComplementaresOptions,
	encaminhamentoOptions,
	disposicaoOptions,
	exigeDecisaoSred,
	tipoAtividadeEhTfmTaf,
	origemLesaoHabilitada,
	inferLateralidade,
	toggleListOption,
}: NovoAtendimentoStepPanelsProps) => {
	const normalizarNrMilitar = (value: string) => value.replace(/\D/g, '');
	const nrMilitarDigitado = normalizarNrMilitar(cadeteNrMilitar);
	const candidatosCadete = (militares ?? []).filter((item) =>
		normalizarNrMilitar(item.nr_militar).startsWith(nrMilitarDigitado),
	);
	const cadeteSelecionado =
		nrMilitarDigitado.length === 0
			? null
			: candidatosCadete.find((item) => normalizarNrMilitar(item.nr_militar) === nrMilitarDigitado) ??
				(candidatosCadete.length === 1 ? candidatosCadete[0] : null);
	const lateralidadeInferidaAtual = inferLateralidade(formData.segmento_corporal, formData.estrutura_anatomica);
	const bloquearLateralidadeManual =
		Boolean(formData.segmento_corporal || formData.estrutura_anatomica) &&
		lateralidadeInferidaAtual === 'Não é o caso';

	return (
		<>
			<Box
				sx={{
					display: currentStep === 1 ? 'block' : 'none',
					animation: currentStep === 1 ? 'slideInStep 280ms ease-out' : undefined,
					'@keyframes slideInStep': {
						from: { transform: 'translateX(24px)', opacity: 0.15 },
						to: { transform: 'translateX(0)', opacity: 1 },
					},
				}}
			>
				<SectionCard title="1 · Identificação">
					<Stack spacing={1.5}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								label="Cadete / Paciente (Nº Militar)"
								value={cadeteNrMilitar}
								onChange={(event) => {
									const nr = normalizarNrMilitar(event.target.value);
									setCadeteNrMilitar(nr);
									const candidatos = (militares ?? []).filter((item) =>
										normalizarNrMilitar(item.nr_militar).startsWith(nr),
									);
									const selecionado =
										nr.length === 0
											? null
											: candidatos.find((item) => normalizarNrMilitar(item.nr_militar) === nr) ??
												(candidatos.length === 1 ? candidatos[0] : null);

									setFormData((current) => ({
										...current,
										cadete_id: selecionado ? String(selecionado.id) : '',
									}));
								}}
								required
								fullWidth
								helperText={
									militares && militares.length === 0
										? 'Cadastre um cadete/aluno primeiro'
										: nrMilitarDigitado.length > 0 && cadeteSelecionado
											? `Nome: ${cadeteSelecionado.nome_completo}`
											: nrMilitarDigitado.length > 0
												? 'Nenhum cadete/aluno encontrado para o número informado.'
												: 'Digite o Nº Militar para localizar automaticamente o nome.'
								}
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							/>

							<TextField
								select
								label="Médico Responsável"
								value={formData.medico_id}
								onChange={(event) =>
									setFormData((current) => ({ ...current, medico_id: event.target.value }))
								}
								required
								fullWidth
								helperText={
									medicos.length === 0 ? 'Cadastre um profissional de saúde com perfil médico.' : undefined
								}
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{medicos.map((item) => (
									<MenuItem key={item.id} value={String(item.id)}>
										Médico #{item.id} · {item.registro_profissional || item.especialidade}
									</MenuItem>
								))}
							</TextField>

							<TextField
								select
								label="Tipo"
								value={formData.tipo_atendimento}
								onChange={(event) =>
									setFormData((current) => ({
										...current,
										tipo_atendimento: event.target.value as TipoAtendimentoForm,
									}))
								}
								required
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{tipoAtendimentoOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>
						</Stack>

						{formData.tipo_atendimento === 'Retorno' && (
							<TextField
								label="ID do Atendimento de Origem"
								type="number"
								value={formData.atendimento_origem_id}
								onChange={(event) =>
									setFormData((current) => ({
										...current,
										atendimento_origem_id: event.target.value,
									}))
								}
								required
								fullWidth
								helperText="Informe o ID do atendimento inicial que originou este retorno."
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							/>
						)}

						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								label="Data"
								value={carimboData}
								InputProps={{ readOnly: true }}
								required
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							/>
							<TextField
								label="Hora"
								value={carimboHora}
								InputProps={{ readOnly: true }}
								required
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							/>
						</Stack>
					</Stack>
				</SectionCard>
			</Box>

			<Box
				sx={{
					display: currentStep === 2 ? 'block' : 'none',
					animation: currentStep === 2 ? 'slideInStep 280ms ease-out' : undefined,
				}}
			>
				<SectionCard title="2 · Taxonomia da Lesão (SAC)">
					<Stack spacing={1.5}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								select
								label="Tipo"
								value={formData.tipo_lesao}
								onChange={(event) =>
									setFormData((current) => ({
										...current,
										tipo_lesao: event.target.value as TipoLesaoForm,
										origem_lesao: event.target.value !== 'Óssea' ? 'Outra' : '',
										segmento_corporal: '',
										estrutura_anatomica: '',
										localizacao_lesao: '',
										lateralidade: '',
									}))
								}
								required
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{tipoLesaoOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>

							<TextField
								select
								label="Origem da Lesão"
								value={formData.origem_lesao}
								onChange={(event) =>
									setFormData((current) => ({
										...current,
										origem_lesao: event.target.value as OrigemLesaoForm,
									}))
								}
								required={origemLesaoHabilitada}
								disabled={!origemLesaoHabilitada}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{(origemLesaoHabilitada
									? origemLesaoOptions.filter((o) => o !== 'Outra')
									: origemLesaoOptions
								).map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>

							<TextField
								select
								label="Parte do Corpo"
								value={formData.segmento_corporal}
								onChange={(event) =>
									setFormData((current) => ({
										...current,
										segmento_corporal: event.target.value,
										estrutura_anatomica: '',
										localizacao_lesao: '',
										lateralidade: inferLateralidade(event.target.value, ''),
									}))
								}
								required
								disabled={!formData.tipo_lesao || segmentoOptions.length === 0}
								fullWidth
								helperText={
									formData.tipo_lesao && segmentoOptions.length === 0
										? 'Sem referências disponíveis para este tipo de lesão.'
										: undefined
								}
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{segmentoOptions.length === 0 ? (
									<MenuItem value="" disabled>
										Sem referências
									</MenuItem>
								) : null}
								{segmentoOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>
						</Stack>

						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								select
								label="Parte Lesionada"
								value={formData.estrutura_anatomica}
								onChange={(event) => {
									const estrutura = event.target.value;
									const lateralidadeInferida = inferLateralidade(formData.segmento_corporal, estrutura);
									setFormData((current) => ({
										...current,
										estrutura_anatomica: estrutura,
										localizacao_lesao: estrutura,
										lateralidade: lateralidadeInferida,
									}));
								}}
								required
								disabled={!formData.segmento_corporal || estruturaOptions.length === 0}
								fullWidth
								helperText={
									formData.segmento_corporal && estruturaOptions.length === 0
										? 'Sem referências disponíveis para este segmento.'
										: undefined
								}
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{estruturaOptions.length === 0 ? (
									<MenuItem value="" disabled>
										Sem referências
									</MenuItem>
								) : null}
								{estruturaOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>

							<TextField
								select
								label="Lateralidade"
								value={formData.lateralidade}
								onChange={(event) =>
									setFormData((current) => ({
										...current,
										lateralidade: event.target.value as LateralidadeForm,
									}))
								}
								required
								disabled={bloquearLateralidadeManual}
								helperText={
									bloquearLateralidadeManual
										? 'Estruturas de linha média usam lateralidade N/A automaticamente.'
										: undefined
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{bloquearLateralidadeManual ? (
									<MenuItem value="Não é o caso">N/A</MenuItem>
								) : (
									[
										<MenuItem key="Bilateral" value="Bilateral">Bilateral</MenuItem>,
										<MenuItem key="Direita" value="Direita">Direita</MenuItem>,
										<MenuItem key="Esquerda" value="Esquerda">Esquerda</MenuItem>,
										<MenuItem key="NA" value="Não é o caso">N/A</MenuItem>,
									]
								)}
							</TextField>
						</Stack>

						<TextField
							select
							label="Local da Lesão"
							value={formData.localizacao_lesao}
							onChange={(event) =>
								setFormData((current) => ({ ...current, localizacao_lesao: event.target.value }))
							}
							required
							disabled={!formData.estrutura_anatomica || localizacaoSelectOptions.length === 0}
							helperText={
								formData.estrutura_anatomica &&
								localizacaoSelectOptions.length === 1 &&
								localizacaoSelectOptions[0] === formData.estrutura_anatomica
									? 'Sem sublocalizações específicas; usando referência da estrutura.'
									: undefined
							}
							fullWidth
							sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
						>
							{localizacaoSelectOptions.length === 0 ? (
								<MenuItem value="" disabled>
									Sem referências
								</MenuItem>
							) : null}
							{localizacaoSelectOptions.map((item) => (
								<MenuItem key={item} value={item}>
									{item}
								</MenuItem>
							))}
						</TextField>

						{exigeDecisaoSred ? (
							<Stack spacing={1}>
								<Typography variant="subtitle2">Decisão S-RED</Typography>
								<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
									{decisaoSredOptions.map((item) => {
										const isSelected = formData.decisao_sred === item;
										return (
											<Button
												key={item}
												type="button"
												variant={isSelected ? 'contained' : 'outlined'}
												onClick={() =>
													setFormData((current) => ({
														...current,
														decisao_sred: item as DecisaoSredForm,
													}))
												}
												sx={{ minHeight: 44, minWidth: 44 }}
											>
												{item}
											</Button>
										);
									})}
								</Stack>
							</Stack>
						) : null}
					</Stack>
				</SectionCard>
			</Box>

			<Box
				sx={{
					display: currentStep === 3 ? 'block' : 'none',
					animation: currentStep === 3 ? 'slideInStep 280ms ease-out' : undefined,
				}}
			>
				<SectionCard title="3 · Contexto Operacional">
					<Stack spacing={1.5}>
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								select
								label="Classificação da Atividade"
								value={formData.classificacao_atividade}
								onChange={(event) =>
									setFormData((current) => ({ ...current, classificacao_atividade: event.target.value }))
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{classificacaoAtividadeOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>

							<TextField
								select
								label="Tipo de Atividade"
								value={formData.tipo_atividade}
								onChange={(event) => {
									const tipoAtividade = event.target.value;
									setFormData((current) => ({
										...current,
										tipo_atividade: tipoAtividade,
										tfm_taf:
											tipoAtividade.trim().toUpperCase() === 'TFM/TAF'
												? current.tfm_taf || 'Não informado'
												: 'Não informado',
									}));
								}}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{tipoAtividadeOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>

							<TextField
								select
								label="TFM / TAF"
								value={formData.tfm_taf}
								onChange={(event) =>
									setFormData((current) => ({ ...current, tfm_taf: event.target.value }))
								}
								disabled={!tipoAtividadeEhTfmTaf}
								helperText={
									!tipoAtividadeEhTfmTaf
										? 'Disponível quando Tipo de Atividade for TFM/TAF. Em outros casos permanece Não informado.'
										: undefined
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{tfmTafOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>
						</Stack>

						<Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
							<TextField
								select
								label="Modalidade Esportiva"
								value={formData.modalidade_esportiva}
								onChange={(event) =>
									setFormData((current) => ({ ...current, modalidade_esportiva: event.target.value }))
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{modalidadeOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>

							<TextField
								select
								label="Conduta Terapêutica"
								value={formData.conduta_terapeutica}
								onChange={(event) =>
									setFormData((current) => ({ ...current, conduta_terapeutica: event.target.value }))
								}
								fullWidth
								sx={{ '& .MuiInputBase-root': { minHeight: 44 } }}
							>
								{condutaOptions.map((item) => (
									<MenuItem key={item} value={item}>
										{item}
									</MenuItem>
								))}
							</TextField>
						</Stack>

						<FormControlLabel
							control={
								<Checkbox
									checked={formData.medicamentoso}
									onChange={(event) =>
										setFormData((current) => ({
											...current,
											medicamentoso: event.target.checked,
										}))
									}
								/>
							}
							label="Tratamento Medicamentoso"
							sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
						/>
					</Stack>
				</SectionCard>
			</Box>

			<Box
				sx={{
					display: currentStep === 4 ? 'block' : 'none',
					animation: currentStep === 4 ? 'slideInStep 280ms ease-out' : undefined,
				}}
			>
				<SectionCard title="4 · Plano Assistencial e Encaminhamentos">
					<Stack spacing={1.5}>
						<FormControlLabel
							control={
								<Checkbox
									checked={formData.solicitar_exames_complementares}
									onChange={(event) =>
										setFormData((current) => ({
											...current,
											solicitar_exames_complementares: event.target.checked,
											exames_complementares: event.target.checked
												? current.exames_complementares
												: [],
										}))
									}
								/>
							}
							label="Solicitar Exames Complementares"
						/>

						{formData.solicitar_exames_complementares ? (
							<>
								<Typography variant="subtitle2">Exames Complementares</Typography>
								<Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
									{examesComplementaresOptions.map((item) => (
										<FormControlLabel
											key={item}
											control={
												<Checkbox
													checked={formData.exames_complementares.includes(item)}
													onChange={(event) =>
														toggleListOption('exames_complementares', item, event.target.checked)
													}
												/>
											}
											label={item}
										/>
									))}
								</Stack>
							</>
						) : null}

						<Typography variant="subtitle2">Encaminhamentos Multidisciplinares</Typography>
						<Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
							{encaminhamentoOptions.map((item) => (
								<FormControlLabel
									key={item}
									control={
										<Checkbox
											checked={formData.encaminhamentos_multidisciplinares.includes(item)}
											onChange={(event) =>
												toggleListOption(
													'encaminhamentos_multidisciplinares',
													item,
													event.target.checked,
												)
											}
										/>
									}
									label={item}
								/>
							))}
						</Stack>

						<Typography variant="subtitle2">Disposição / Situação do Cadete</Typography>
						<Stack direction="row" useFlexGap flexWrap="wrap" spacing={1}>
							{disposicaoOptions.map((item) => (
								<FormControlLabel
									key={item}
									control={
										<Checkbox
											checked={formData.disposicao_cadete.includes(item)}
											onChange={(event) =>
												toggleListOption('disposicao_cadete', item, event.target.checked)
											}
										/>
									}
									label={item}
								/>
							))}
						</Stack>
					</Stack>
				</SectionCard>
			</Box>

			<Box
				sx={{
					display: currentStep === 5 ? 'block' : 'none',
					animation: currentStep === 5 ? 'slideInStep 280ms ease-out' : undefined,
				}}
			>
				<SectionCard title="5 · Síntese Clínica">
					<Stack spacing={1.5}>
						<TextField
							label="Notas Clínicas"
							value={formData.notas_clinicas}
							onChange={(event) =>
								setFormData((current) => ({ ...current, notas_clinicas: event.target.value }))
							}
							placeholder="Observações clínicas, anamnese, evolução..."
							multiline
							minRows={3}
							fullWidth
						/>
					</Stack>
				</SectionCard>
			</Box>
		</>
	);
};

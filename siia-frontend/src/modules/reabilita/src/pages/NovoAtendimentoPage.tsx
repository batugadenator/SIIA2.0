import { useEffect, useState, type FormEvent } from 'react';

import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import axios from 'axios';

import { NovoAtendimentoFormFooter } from '../components/atendimento/NovoAtendimentoFormFooter';
import { NovoAtendimentoProgressHeader } from '../components/atendimento/NovoAtendimentoProgressHeader';
import { NovoAtendimentoStepPanels } from '../components/atendimento/NovoAtendimentoStepPanels';
import { SectionCard, useNotify } from '../design-system';
import { useAtendimentoReferencias, useCreateAtendimento } from '../hooks/useAtendimentos';
import {
	buildCreateAtendimentoPayload,
	processSteps,
	syncNovoAtendimentoFormWithReferencias,
	toggleStringListOption,
	useNovoAtendimentoProcess,
	validateNovoAtendimentoStepAdvance,
	validateNovoAtendimentoSubmission,
	type NovoAtendimentoFormState,
} from '../hooks/useNovoAtendimentoProcess';
import { useMilitares, useProfissionaisSaude } from '../hooks/usePessoal';

const initialFormState: NovoAtendimentoFormState = {
	cadete_id: '',
	medico_id: '',
	atendimento_origem_id: '',
	tipo_atendimento: 'Inicial',
	tipo_lesao: '',
	origem_lesao: 'Outra',
	segmento_corporal: '',
	estrutura_anatomica: '',
	localizacao_lesao: '',
	lateralidade: '',
	decisao_sred: '',
	classificacao_atividade: 'Não informado',
	tipo_atividade: 'Não informado',
	tfm_taf: 'Não informado',
	modalidade_esportiva: 'Não informado',
	conduta_terapeutica: 'Não definido',
	medicamentoso: false,
	solicitar_exames_complementares: false,
	exames_complementares: [],
	encaminhamentos_multidisciplinares: [],
	disposicao_cadete: [],
	notas_clinicas: '',
};

const formatDateBr = (date: Date): string => {
	return date.toLocaleDateString('pt-BR');
};

const formatTimeBr = (date: Date): string => {
	return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const getErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		const detail = error.response?.data?.detail;
		if (typeof detail === 'string' && detail.trim()) {
			return detail;
		}

		const payload = error.response?.data as Record<string, unknown> | undefined;
		if (payload) {
			const firstKey = Object.keys(payload)[0];
			if (firstKey) {
				const value = payload[firstKey];
				if (Array.isArray(value) && typeof value[0] === 'string') {
					return value[0];
				}
				if (typeof value === 'string') {
					return value;
				}
			}
		}
	}

	return 'Não foi possível registrar o atendimento.';
};

export const NovoAtendimentoPage = () => {
	const notify = useNotify();
	const [carimboSistema] = useState<Date>(() => new Date());
	const createAtendimentoMutation = useCreateAtendimento();
	const {
		data: militares,
		isLoading: isLoadingMilitares,
		isError: isErrorMilitares,
		refetch: refetchMilitares,
	} = useMilitares();
	const {
		data: profissionais,
		isLoading: isLoadingProfissionais,
		isError: isErrorProfissionais,
		refetch: refetchProfissionais,
	} = useProfissionaisSaude();
	const {
		data: referencias,
		isLoading: isLoadingReferencias,
		isError: isErrorReferencias,
		refetch: refetchReferencias,
	} = useAtendimentoReferencias();

	const [formData, setFormData] = useState<NovoAtendimentoFormState>(initialFormState);
	const [cadeteNrMilitar, setCadeteNrMilitar] = useState('');
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [currentStep, setCurrentStep] = useState(1);

	const {
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
		stepCompletionByIndex,
		inferLateralidade,
	} = useNovoAtendimentoProcess({
		formData,
		referencias,
		profissionais,
	});

	useEffect(() => {
		if (!formData.medico_id && medicos.length > 0) {
			setFormData((current) => ({
				...current,
				medico_id: String(medicos[0].id),
			}));
		}
	}, [medicos, formData.medico_id]);

	useEffect(() => {
		setFormData((current) =>
			syncNovoAtendimentoFormWithReferencias({
				formData: current,
				referencias,
			}),
		);
	}, [referencias]);

	useEffect(() => {
		if (!exigeDecisaoSred && formData.decisao_sred) {
			setFormData((current) => ({
				...current,
				decisao_sred: '',
			}));
		}
	}, [exigeDecisaoSred, formData.decisao_sred]);

	useEffect(() => {
		if (!formData.cadete_id) {
			return;
		}

		const selecionado = (militares ?? []).find((item) => String(item.id) === formData.cadete_id);
		if (selecionado) {
			setCadeteNrMilitar(selecionado.nr_militar.replace(/\D/g, ''));
		}
	}, [formData.cadete_id, militares]);

	const toggleListOption = (
		field: 'exames_complementares' | 'encaminhamentos_multidisciplinares' | 'disposicao_cadete',
		option: string,
		checked: boolean,
	) => {
		setFormData((current) => ({
			...current,
			[field]: toggleStringListOption({
				currentList: current[field],
				option,
				checked,
			}),
		}));
	};

	const goToPreviousStep = () => {
		setCurrentStep((current) => Math.max(1, current - 1));
	};

	const goToNextStep = () => {
		const validationMessage = validateNovoAtendimentoStepAdvance({
			currentStep,
			formData,
			stepCompletionByIndex,
			exigeDecisaoSred,
		});

		if (validationMessage) {
			setSubmitError(validationMessage);
			notify(validationMessage, 'warning');
			return;
		}

		setSubmitError(null);
		setCurrentStep((current) => Math.min(5, current + 1));
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitError(null);

		const validationMessage = validateNovoAtendimentoSubmission({
			formData,
			exigeDecisaoSred,
		});

		if (validationMessage) {
			setSubmitError(validationMessage);
			notify(validationMessage, 'error');
			return;
		}

		try {
			const payload = buildCreateAtendimentoPayload({
				formData,
				exigeDecisaoSred,
			});

			await createAtendimentoMutation.mutateAsync(payload);
			notify('Atendimento registrado com sucesso.', 'success');
			const cadeteIdAtual = formData.cadete_id;
			const medicoIdAtual = formData.medico_id;
			const nrMilitarAtual = cadeteNrMilitar;
			setCurrentStep(1);
			setFormData(() => ({
				...initialFormState,
				cadete_id: cadeteIdAtual,
				medico_id: medicoIdAtual,
			}));
			setCadeteNrMilitar(nrMilitarAtual);
		} catch (error) {
			const message = getErrorMessage(error);
			setSubmitError(message);
			notify(message, 'error');
		}
	};

	if (isLoadingMilitares || isLoadingProfissionais || isLoadingReferencias) {
		return (
			<Stack alignItems="center" justifyContent="center" minHeight="45vh">
				<CircularProgress />
			</Stack>
		);
	}

	if (isErrorMilitares || isErrorProfissionais || isErrorReferencias) {
		return (
			<SectionCard title="Falha ao carregar dados de apoio">
				<Stack spacing={1.5}>
					<Typography color="text.secondary">
						Não foi possível carregar cadetes, profissionais e referências clínicas.
					</Typography>
					<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
						<Button variant="contained" onClick={() => void refetchMilitares()} sx={{ minHeight: 44, minWidth: 44 }}>
							Recarregar Cadetes
						</Button>
						<Button variant="outlined" onClick={() => void refetchProfissionais()} sx={{ minHeight: 44, minWidth: 44 }}>
							Recarregar Profissionais
						</Button>
						<Button variant="outlined" onClick={() => void refetchReferencias()} sx={{ minHeight: 44, minWidth: 44 }}>
							Recarregar Referências
						</Button>
					</Stack>
				</Stack>
			</SectionCard>
		);
	}

	return (
		<Stack spacing={2}>
			<Typography variant="h5">Novo Atendimento</Typography>
			<Typography variant="subtitle2" color="text.secondary">
				Protocolo S-RED • Registro clínico
			</Typography>
			<Typography variant="caption" color="text.secondary">
				Fluxo orientado pela taxonomia SAC e perfis de equipe dos seeds 001_roles_users.sql e 002_sac_reference_data.sql.
			</Typography>

			<Stack component="form" spacing={2} onSubmit={handleSubmit}>
				<NovoAtendimentoProgressHeader
					currentStep={currentStep}
					processSteps={processSteps}
					stepCompletionByIndex={stepCompletionByIndex}
					onPrevious={goToPreviousStep}
					onNext={goToNextStep}
				/>

				<NovoAtendimentoStepPanels
					currentStep={currentStep}
					formData={formData}
					setFormData={setFormData}
					cadeteNrMilitar={cadeteNrMilitar}
					setCadeteNrMilitar={setCadeteNrMilitar}
					carimboData={formatDateBr(carimboSistema)}
					carimboHora={formatTimeBr(carimboSistema)}
					militares={militares}
					medicos={medicos}
					tipoAtendimentoOptions={tipoAtendimentoOptions}
					tipoLesaoOptions={tipoLesaoOptions}
					origemLesaoOptions={origemLesaoOptions}
					decisaoSredOptions={decisaoSredOptions}
					segmentoOptions={segmentoOptions}
					estruturaOptions={estruturaOptions}
					localizacaoSelectOptions={localizacaoSelectOptions}
					classificacaoAtividadeOptions={classificacaoAtividadeOptions}
					tipoAtividadeOptions={tipoAtividadeOptions}
					tfmTafOptions={tfmTafOptions}
					modalidadeOptions={modalidadeOptions}
					condutaOptions={condutaOptions}
					examesComplementaresOptions={examesComplementaresOptions}
					encaminhamentoOptions={encaminhamentoOptions}
					disposicaoOptions={disposicaoOptions}
					exigeDecisaoSred={exigeDecisaoSred}
					tipoAtividadeEhTfmTaf={tipoAtividadeEhTfmTaf}
					origemLesaoHabilitada={origemLesaoHabilitada}
					inferLateralidade={inferLateralidade}
					toggleListOption={toggleListOption}
				/>

				<NovoAtendimentoFormFooter
					submitError={submitError}
					isSubmitting={createAtendimentoMutation.isPending}
					canSubmit={currentStep === 5}
					onCancel={() => {
						const cadeteIdAtual = formData.cadete_id;
						const medicoIdAtual = formData.medico_id;
						const nrMilitarAtual = cadeteNrMilitar;
						setCurrentStep(1);
						setFormData(() => ({
							...initialFormState,
							cadete_id: cadeteIdAtual,
							medico_id: medicoIdAtual,
						}));
						setCadeteNrMilitar(nrMilitarAtual);
					}}
				/>
			</Stack>
		</Stack>
	);
};

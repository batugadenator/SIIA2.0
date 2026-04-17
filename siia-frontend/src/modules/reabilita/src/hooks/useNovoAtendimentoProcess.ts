import { useMemo } from 'react';

import type { ProfissionalSaude } from '../types/pessoal';
import type {
	AtendimentoReferenciasResponse,
	CreateAtendimentoPayload,
	DecisaoSred,
	Lateralidade,
	OrigemLesao,
	TipoAtendimento,
	TipoLesao,
} from '../types/atendimento';

export type TipoAtendimentoForm = TipoAtendimento | '';
export type TipoLesaoForm = TipoLesao | '';
export type OrigemLesaoForm = OrigemLesao | '';
export type LateralidadeForm = Lateralidade | '';
export type DecisaoSredForm = DecisaoSred | '';

export interface NovoAtendimentoFormState {
	cadete_id: string;
	medico_id: string;
	atendimento_origem_id: string;
	tipo_atendimento: TipoAtendimentoForm;
	tipo_lesao: TipoLesaoForm;
	origem_lesao: OrigemLesaoForm;
	segmento_corporal: string;
	estrutura_anatomica: string;
	localizacao_lesao: string;
	lateralidade: LateralidadeForm;
	decisao_sred: DecisaoSredForm;
	classificacao_atividade: string;
	tipo_atividade: string;
	tfm_taf: string;
	modalidade_esportiva: string;
	conduta_terapeutica: string;
	medicamentoso: boolean;
	solicitar_exames_complementares: boolean;
	exames_complementares: string[];
	encaminhamentos_multidisciplinares: string[];
	disposicao_cadete: string[];
	notas_clinicas: string;
}

const fallbackTipoLesaoOptions: TipoLesao[] = ['Óssea', 'Articular', 'Muscular', 'Tendinosa', 'Neurológica'];
const fallbackTipoAtividadeOptions = [
	'Não informado',
	'Acadêmicas',
	'Campo',
	'Deslocamento',
	'EDL',
	'Equitação',
	'Formatura',
	'Inopinado',
	'Manobrão',
	'Marcha',
	'NAVAMAER',
	'Outros',
	'Parque',
	'Serviço',
	'SIESP',
	'TFM/TAF',
	'Treino atleta',
];
const fallbackTfmTafOptions = [
	'Não informado',
	'Abdominal',
	'Barra',
	'Corda',
	'Corrida',
	'Flexão',
	'Natação',
	'Pista Rondom',
	'PPM',
	'Salto plataforma',
];
const fallbackModalidadeOptions = [
	'Não informado',
	'Aquathlon',
	'Atletismo',
	'Basquetebol',
	'Esgrima',
	'Futebol',
	'Hipismo',
	'Judô',
	'Natação',
	'Orientação',
	'Pentatlo Militar',
	'Pentatlo Moderno',
	'Polo Aquático',
	'Tiro',
	'Triatlo',
	'Voleibol',
];
const profissaoMedicaAlias = new Set(['médico', 'medico', 'doctor']);

export const processSteps = [
	{ id: 1, title: 'Identificação' },
	{ id: 2, title: 'Taxonomia SAC' },
	{ id: 3, title: 'Contexto Operacional' },
	{ id: 4, title: 'Plano Assistencial' },
	{ id: 5, title: 'Síntese Clínica' },
];

interface UseNovoAtendimentoProcessParams {
	formData: NovoAtendimentoFormState;
	referencias?: AtendimentoReferenciasResponse;
	profissionais?: ProfissionalSaude[];
}

interface BuildCreateAtendimentoPayloadParams {
	formData: NovoAtendimentoFormState;
	exigeDecisaoSred: boolean;
}

interface ValidateNovoAtendimentoSubmissionParams {
	formData: NovoAtendimentoFormState;
	exigeDecisaoSred: boolean;
}

interface ValidateNovoAtendimentoStepAdvanceParams {
	currentStep: number;
	formData: NovoAtendimentoFormState;
	stepCompletionByIndex: Record<number, boolean>;
	exigeDecisaoSred: boolean;
}

interface SyncNovoAtendimentoFormWithReferenciasParams {
	formData: NovoAtendimentoFormState;
	referencias?: AtendimentoReferenciasResponse;
}

interface ToggleStringListOptionParams {
	currentList: string[];
	option: string;
	checked: boolean;
}

const resolveOptionValue = (currentValue: string, options: string[], fallbackValue: string): string => {
	if (options.includes(currentValue)) {
		return currentValue;
	}
	return options[0] || fallbackValue;
};

export const toggleStringListOption = ({
	currentList,
	option,
	checked,
}: ToggleStringListOptionParams): string[] => {
	if (checked) {
		return currentList.includes(option) ? currentList : [...currentList, option];
	}

	return currentList.filter((item) => item !== option);
};

export const validateNovoAtendimentoSubmission = ({
	formData,
	exigeDecisaoSred,
}: ValidateNovoAtendimentoSubmissionParams): string | null => {
	if (!formData.cadete_id) {
		return 'Selecione o cadete/paciente antes de registrar.';
	}

	if (!formData.medico_id) {
		return 'Nenhum médico disponível para vínculo do atendimento.';
	}

	if (!formData.tipo_atendimento) {
		return 'Informe o tipo de atendimento (Inicial ou Retorno).';
	}

	if (!formData.tipo_lesao || !formData.segmento_corporal || !formData.estrutura_anatomica) {
		return 'Preencha Tipo, Parte do Corpo e Parte Lesionada para classificar o caso.';
	}

	if (!formData.lateralidade) {
		return 'Informe a Lateralidade.';
	}

	if (exigeDecisaoSred && !formData.decisao_sred) {
		return 'Selecione a Decisão S-RED (S-RED Positivo ou S-RED Negativo).';
	}

	if (formData.solicitar_exames_complementares && formData.exames_complementares.length === 0) {
		return 'Selecione ao menos um exame complementar quando o campo estiver habilitado.';
	}

	return null;
};

export const validateNovoAtendimentoStepAdvance = ({
	currentStep,
	formData,
	stepCompletionByIndex,
	exigeDecisaoSred,
}: ValidateNovoAtendimentoStepAdvanceParams): string | null => {
	if (currentStep === 1 && !stepCompletionByIndex[1]) {
		const camposFaltantes: string[] = [];
		if (!formData.cadete_id) camposFaltantes.push('Cadete / Paciente');
		if (!formData.medico_id) camposFaltantes.push('Médico Responsável');
		if (!formData.tipo_atendimento) camposFaltantes.push('Tipo');
		if (formData.tipo_atendimento === 'Retorno' && !formData.atendimento_origem_id.trim()) {
			camposFaltantes.push('ID do Atendimento de Origem');
		}

		return camposFaltantes.length
			? `Etapa 1: faltam ${camposFaltantes.join(', ')}.`
			: 'Preencha os campos obrigatórios da etapa 1 antes de avançar.';
	}

	if (currentStep === 2 && !stepCompletionByIndex[2]) {
		const camposFaltantes: string[] = [];
		if (!formData.tipo_lesao) camposFaltantes.push('Tipo');
		if (formData.tipo_lesao === 'Óssea' && !formData.origem_lesao) camposFaltantes.push('Origem da Lesão');
		if (!formData.segmento_corporal.trim()) camposFaltantes.push('Parte do Corpo');
		if (!formData.estrutura_anatomica.trim()) camposFaltantes.push('Parte Lesionada');
		if (!formData.lateralidade) camposFaltantes.push('Lateralidade');
		if (!formData.localizacao_lesao.trim()) camposFaltantes.push('Local da Lesão');
		if (exigeDecisaoSred && !formData.decisao_sred) camposFaltantes.push('Decisão S-RED');

		return camposFaltantes.length
			? `Etapa 2: faltam ${camposFaltantes.join(', ')}.`
			: 'Preencha os campos obrigatórios da etapa 2 antes de avançar.';
	}

	return null;
};

export const syncNovoAtendimentoFormWithReferencias = ({
	formData,
	referencias,
}: SyncNovoAtendimentoFormWithReferenciasParams): NovoAtendimentoFormState => {
	if (!referencias) {
		return formData;
	}

	return {
		...formData,
		origem_lesao: resolveOptionValue(formData.origem_lesao, referencias.origem_lesao_options, 'Outra') as OrigemLesaoForm,
		classificacao_atividade: resolveOptionValue(
			formData.classificacao_atividade,
			referencias.classificacao_atividade_options,
			'Não informado',
		),
		tipo_atividade: resolveOptionValue(formData.tipo_atividade, referencias.tipo_atividade_options, 'Não informado'),
		tfm_taf: resolveOptionValue(formData.tfm_taf, referencias.tfm_taf_options, 'Não informado'),
		modalidade_esportiva: resolveOptionValue(
			formData.modalidade_esportiva,
			referencias.modalidade_esportiva_options,
			'Não informado',
		),
		conduta_terapeutica: resolveOptionValue(
			formData.conduta_terapeutica,
			referencias.conduta_terapeutica_options,
			'Não definido',
		),
		decisao_sred: (referencias.decisao_sred_options ?? []).includes(formData.decisao_sred as DecisaoSred)
			? formData.decisao_sred
			: '',
	};
};

export const buildCreateAtendimentoPayload = ({
	formData,
	exigeDecisaoSred,
}: BuildCreateAtendimentoPayloadParams): CreateAtendimentoPayload => {
	if (!formData.tipo_atendimento || !formData.tipo_lesao) {
		throw new Error('Tipo de atendimento e tipo de lesão são obrigatórios para montar o payload.');
	}

	const cadeteId = Number(formData.cadete_id);
	if (!Number.isFinite(cadeteId) || cadeteId <= 0) {
		throw new Error('Selecione um cadete/paciente válido.');
	}

	const medicoId = Number(formData.medico_id);
	if (!Number.isFinite(medicoId) || medicoId <= 0) {
		throw new Error('Selecione um médico responsável válido.');
	}

	return {
		cadete_id: cadeteId,
		medico_id: medicoId,
		atendimento_origem_id: formData.atendimento_origem_id ? Number(formData.atendimento_origem_id) : null,
		tipo_atendimento: formData.tipo_atendimento,
		tipo_lesao: formData.tipo_lesao,
		origem_lesao: (formData.origem_lesao || 'Outra') as OrigemLesao,
		segmento_corporal: formData.segmento_corporal.trim(),
		estrutura_anatomica: formData.estrutura_anatomica.trim(),
		localizacao_lesao: formData.localizacao_lesao.trim() || formData.estrutura_anatomica.trim(),
		lateralidade: formData.lateralidade as Lateralidade,
		decisao_sred: exigeDecisaoSred ? formData.decisao_sred : '',
		classificacao_atividade: formData.classificacao_atividade,
		tipo_atividade: formData.tipo_atividade,
		tfm_taf: formData.tfm_taf,
		modalidade_esportiva: formData.modalidade_esportiva,
		conduta_terapeutica: formData.conduta_terapeutica,
		medicamentoso: formData.medicamentoso,
		solicitar_exames_complementares: formData.solicitar_exames_complementares,
		exames_complementares: formData.solicitar_exames_complementares ? formData.exames_complementares : [],
		encaminhamentos_multidisciplinares: formData.encaminhamentos_multidisciplinares,
		disposicao_cadete: formData.disposicao_cadete,
		notas_clinicas: formData.notas_clinicas.trim(),
	};
};

export const useNovoAtendimentoProcess = ({
	formData,
	referencias,
	profissionais,
}: UseNovoAtendimentoProcessParams) => {
	const medicos = useMemo(() => {
		const list = profissionais ?? [];
		return list.filter((item) => profissaoMedicaAlias.has(item.especialidade.toLowerCase()));
	}, [profissionais]);

	const tipoAtendimentoOptions = referencias?.tipo_atendimento_options ?? ['Inicial', 'Retorno'];
	const tipoLesaoOptions = referencias?.tipo_lesao_options ?? fallbackTipoLesaoOptions;
	const origemLesaoOptions = referencias?.origem_lesao_options ?? ['Por Estresse', 'Traumática', 'Outra'];
	const decisaoSredOptions = referencias?.decisao_sred_options ?? ['S-RED Positivo', 'S-RED Negativo'];

	const segmentoOptions = useMemo(() => {
		if (!formData.tipo_lesao) {
			return [];
		}
		return referencias?.segmentos_por_tipo_lesao?.[formData.tipo_lesao] ?? [];
	}, [formData.tipo_lesao, referencias]);

	const estruturaOptions = useMemo(() => {
		if (!formData.tipo_lesao || !formData.segmento_corporal) {
			return [];
		}
		return referencias?.estruturas_por_tipo_segmento?.[formData.tipo_lesao]?.[formData.segmento_corporal] ?? [];
	}, [formData.tipo_lesao, formData.segmento_corporal, referencias]);

	const localizacaoOptions = useMemo(() => {
		if (!formData.tipo_lesao || !formData.segmento_corporal) {
			return [];
		}
		return referencias?.localizacoes_por_tipo_segmento?.[formData.tipo_lesao]?.[formData.segmento_corporal] ?? [];
	}, [formData.tipo_lesao, formData.segmento_corporal, referencias]);

	const localizacaoSelectOptions = useMemo(() => {
		if (localizacaoOptions.length > 0) {
			return localizacaoOptions;
		}
		return formData.estrutura_anatomica ? [formData.estrutura_anatomica] : [];
	}, [localizacaoOptions, formData.estrutura_anatomica]);

	const classificacaoAtividadeOptions = referencias?.classificacao_atividade_options ?? [
		'Não informado',
		'Evitável',
		'Relacionado à Atividade',
	];
	const tipoAtividadeOptions = referencias?.tipo_atividade_options ?? fallbackTipoAtividadeOptions;
	const tfmTafOptions = referencias?.tfm_taf_options ?? fallbackTfmTafOptions;
	const modalidadeOptions = referencias?.modalidade_esportiva_options ?? fallbackModalidadeOptions;
	const condutaOptions = referencias?.conduta_terapeutica_options ?? [
		'Não definido',
		'Cirurgico',
		'Conservador',
		'Pós-operatório',
		'Aguardando Exame',
	];
	const examesComplementaresOptions = referencias?.exames_complementares_options ?? [
		'RX',
		'USG',
		'TC',
		'RM',
		'DEXA',
		'Sangue',
	];
	const encaminhamentoOptions = referencias?.encaminhamentos_options ?? [
		'Fisioterapia',
		'Profissional de Educação Física',
		'Nutricionista',
		'Psicopedagogo',
	];
	const disposicaoOptions = referencias?.disposicao_options ?? [
		'Dispensado',
		'Regime Limitado',
		'Alta',
		'Risco Cirúrgico',
		'VCL',
	];

	const gatilhoSredPorLesaoOrigem =
		formData.tipo_lesao === 'Óssea' && formData.origem_lesao === 'Por Estresse';
	const exigeDecisaoSred = gatilhoSredPorLesaoOrigem;
	const origemLesaoHabilitada = formData.tipo_lesao === 'Óssea';
	const tipoAtividadeEhTfmTaf = formData.tipo_atividade.trim().toUpperCase() === 'TFM/TAF';

	const step1Completo =
		Boolean(formData.cadete_id) &&
		Boolean(formData.medico_id) &&
		Boolean(formData.tipo_atendimento) &&
		(formData.tipo_atendimento !== 'Retorno' || Boolean(formData.atendimento_origem_id.trim()));
	const step2Completo =
		Boolean(formData.tipo_lesao) &&
		(!origemLesaoHabilitada || Boolean(formData.origem_lesao)) &&
		Boolean(formData.segmento_corporal) &&
		Boolean(formData.estrutura_anatomica) &&
		Boolean(formData.lateralidade) &&
		Boolean(formData.localizacao_lesao.trim()) &&
		(!exigeDecisaoSred || Boolean(formData.decisao_sred));
	const step3Completo =
		formData.classificacao_atividade !== 'Não informado' ||
		formData.tipo_atividade !== 'Não informado' ||
		formData.tfm_taf !== 'Não informado' ||
		formData.modalidade_esportiva !== 'Não informado' ||
		formData.conduta_terapeutica !== 'Não definido' ||
		formData.medicamentoso;
	const step4Completo =
		(formData.solicitar_exames_complementares && formData.exames_complementares.length > 0) ||
		formData.exames_complementares.length > 0 ||
		formData.encaminhamentos_multidisciplinares.length > 0 ||
		formData.disposicao_cadete.length > 0;
	const step5Completo = Boolean(formData.notas_clinicas.trim());

	const stepCompletionByIndex: Record<number, boolean> = {
		1: step1Completo,
		2: step2Completo,
		3: step3Completo,
		4: step4Completo,
		5: step5Completo,
	};

	const inferLateralidade = (segmento: string, estrutura: string): Lateralidade => {
		const lateralidadeByEstrutura = referencias?.lateralidade_por_estrutura ?? {};
		const estruturaTrim = estrutura.trim();
		if (estruturaTrim && lateralidadeByEstrutura[estruturaTrim]) {
			return lateralidadeByEstrutura[estruturaTrim];
		}

		const estruturaNormalizada = estruturaTrim.toLowerCase();
		if (estruturaNormalizada.includes('direit')) {
			return 'Direita';
		}
		if (estruturaNormalizada.includes('esquerd')) {
			return 'Esquerda';
		}

		const segmentoNormalizado = segmento.trim().toLowerCase();
		if (
			segmentoNormalizado === 'coluna' ||
			segmentoNormalizado === 'bacia' ||
			segmentoNormalizado === 'tórax' ||
			segmentoNormalizado === 'torax' ||
			segmentoNormalizado === 'core'
		) {
			return 'Não é o caso';
		}

		return 'Bilateral';
	};

	return {
		medicos,
		processSteps,
		tipoAtendimentoOptions,
		tipoLesaoOptions,
		origemLesaoOptions,
		decisaoSredOptions,
		segmentoOptions,
		estruturaOptions,
		localizacaoOptions,
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
		origemLesaoHabilitada,
		tipoAtividadeEhTfmTaf,
		stepCompletionByIndex,
		inferLateralidade,
	};
};

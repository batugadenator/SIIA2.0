export type ReatividadeCognitiva = 'Baixa' | 'Moderada' | 'Alta';

export type CargaCognitivaSessao = 'Leve' | 'Moderada' | 'Alta';

export type MotivoAtendimentoPsico =
	| 'Atendimento Inicial'
	| 'Atendimento de Acompanhamento'
	| 'Trancamento/Desligamento'
	| 'Desempenho Acadêmico em Geral'
	| 'Avaliação Atitudinal'
	| 'Questões pessoais'
	| 'Saúde Geral'
	| 'Saúde Mental'
	| 'Em acompanhamento no REABILITA';

export interface IntervencaoPsicopedagogica {
	id: number;
	atendimento_id: number;
	avaliacao_fisioterapia_id: number | null;
	psicopedagogo_id: number;
	psicopedagogo_nome: string;
	indice_fadiga_cognitiva: number;
	atencao_sustentada_score: number;
	reatividade_cognitiva: ReatividadeCognitiva;
	latencia_recuperacao_horas: number;
	carga_cognitiva_sessao: CargaCognitivaSessao;
	estrategia_aprendizagem: string;
	diario_bordo: string;
	plano_progressao: string;
	data_atendimento: string | null;
	motivo_atendimento: MotivoAtendimentoPsico | '';
	encaminhamentos_realizados: string;
	observacoes: string;
	reatividade_cognitiva_options: ReatividadeCognitiva[];
	carga_cognitiva_options: CargaCognitivaSessao[];
	motivo_atendimento_options: MotivoAtendimentoPsico[];
	criado_em: string;
	atualizado_em: string;
}

export interface CreateIntervencaoPsicopedagogicaPayload {
	atendimento_id: number;
	avaliacao_fisioterapia_id?: number | null;
	data_atendimento?: string | null;
	motivo_atendimento?: string;
	encaminhamentos_realizados?: string;
	observacoes?: string;
	indice_fadiga_cognitiva?: number;
	atencao_sustentada_score?: number;
	reatividade_cognitiva?: ReatividadeCognitiva;
	latencia_recuperacao_horas?: number;
	carga_cognitiva_sessao?: CargaCognitivaSessao;
	estrategia_aprendizagem?: string;
	diario_bordo?: string;
	plano_progressao?: string;
}

export interface SredResumoCompartilhadoResponse {
	atendimento: {
		id: number;
		cadete_nome: string;
		tipo_lesao: string;
		flag_sred: boolean;
		decisao_sred: string;
	};
	fisioterapia: {
		reatividade: string;
		gravidade_eva: number | null;
		liberado_para_pef: boolean;
		liberado_para_pef_em: string | null;
	};
	educacao_fisica: {
		tonelagem_sessao: number | null;
		pse_paciente: number | null;
		reatividade_24h: string;
		latencia_dor: string;
	};
	psicopedagogia: {
		indice_fadiga_cognitiva: number | null;
		atencao_sustentada_score: number | null;
		reatividade_cognitiva: string;
		latencia_recuperacao_horas: number | null;
		carga_cognitiva_sessao: string;
	};
}

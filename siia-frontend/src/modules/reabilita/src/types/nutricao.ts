export type TecnicaPercentualGordura = '3 dobras' | '7 dobras' | 'ultrassom' | 'bioimpedância';

export interface CreateAvaliacaoNutricionalPayload {
	atendimento_id: number;
	percentual_gordura: number;
	tecnica_utilizada: TecnicaPercentualGordura;
	dexa_solicitado: boolean;
	gasto_isotonico_estimado_homem: number;
	gasto_isotonico_estimado_mulher: number;
	peso_kg: number;
	gasto_calorico_atual: number;
	ingestao_hidrica_atual: number;
	tratamento_ajuste_nutricional: string;
	tratamento_suplementacao: string;
}

export interface AvaliacaoNutricional extends CreateAvaliacaoNutricionalPayload {
	id: number;
	cadete_id: number;
	ingestao_liquida_ideal_ml: number;
	criado_por: number | null;
	criado_por_username: string;
	criado_em: string;
}

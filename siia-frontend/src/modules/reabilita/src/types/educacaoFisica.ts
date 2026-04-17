export type ReatividadePEF = 'Baixa' | 'Moderada' | 'Alta';

export type LatenciaDorPEF = 'Imediata' | 'Até 24h' | 'Até 48h' | 'Após 48h' | 'Sem dor';

export interface SessaoTreinoPEF {
	id: number;
	atendimento_id: number;
	avaliacao_fisioterapia_id: number | null;
	profissional_educacao_fisica_id: number;
	profissional_educacao_fisica_nome: string;
	deficit_forca_percentual: number;
	pse_paciente: number;
	series: number;
	repeticoes: number;
	carga_utilizada_kg: number;
	volume_tonelagem: number;
	volume_treino_semanal: number;
	reatividade_durante: ReatividadePEF;
	reatividade_24h: ReatividadePEF;
	reatividade_48h: ReatividadePEF;
	latencia_dor: LatenciaDorPEF;
	reatividade_options: ReatividadePEF[];
	latencia_options: LatenciaDorPEF[];
	tonelagem_max_reatividade_alta: number;
	analise_biomecanica: string;
	objetivo_condicionamento: string;
	observacoes: string;
	criado_em: string;
	atualizado_em: string;
}

export interface CreateSessaoTreinoPEFPayload {
	atendimento_id: number;
	avaliacao_fisioterapia_id?: number | null;
	deficit_forca_percentual: number;
	pse_paciente: number;
	series: number;
	repeticoes: number;
	carga_utilizada_kg: number;
	volume_treino_semanal?: number;
	reatividade_durante: ReatividadePEF;
	reatividade_24h: ReatividadePEF;
	reatividade_48h: ReatividadePEF;
	latencia_dor: LatenciaDorPEF;
	analise_biomecanica?: string;
	objetivo_condicionamento?: string;
	observacoes?: string;
}

export interface EducacaoFisicaEvolucaoSemanal {
	semana_ref: string;
	sessoes: number;
	tonelagem_media: number;
	pse_medio: number;
	reatividade_pos_treino_predominante: string;
	reatividade_fisio: string;
	eva_fisio: number | null;
}

export interface EducacaoFisicaLimiteClinico {
	reatividade: string;
	eva: number | null;
	liberado_para_pef: boolean;
	liberado_para_pef_em: string | null;
}

export interface EducacaoFisicaEvolucaoCargaResponse {
	atendimento_id: number;
	limite_clinico: EducacaoFisicaLimiteClinico;
	items: EducacaoFisicaEvolucaoSemanal[];
}

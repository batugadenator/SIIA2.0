export type TipoLesao = "Óssea" | "Articular" | "Muscular" | "Tendinosa" | "Neurológica";

export type OrigemLesao = "Por Estresse" | "Traumática" | "Outra" | "";

export type DecisaoSred = "Investigação Pendente" | "Em Investigação" | "S-RED Positivo" | "S-RED Negativo";

export type Lateralidade = "Direita" | "Esquerda" | "Bilateral" | "Não é o caso";

export type TipoAtendimento = "Inicial" | "Retorno";
export type EstadoFluxoAtendimento = "INICIAL" | "MULTIDISCIPLINAR" | "ACOMPANHAMENTO" | "DECISAO_FINAL";
export type ProntidaoInstrutor = "Em Avaliação" | "Totalmente Inapto" | "Apto com Restrições" | "Recuperado";
export type SituacaoFinalInstrutor =
	| "Recuperação Total"
	| "Apto com Restrições"
	| "Sugestão de Trancamento de Matrícula"
	| "Outras Medidas Administrativas";

export interface AtendimentoReferenciasResponse {
	tipo_atendimento_options: TipoAtendimento[];
	tipo_lesao_options: TipoLesao[];
	origem_lesao_options: OrigemLesao[];
	decisao_sred_options: DecisaoSred[];
	classificacao_atividade_options: string[];
	tipo_atividade_options: string[];
	tfm_taf_options: string[];
	modalidade_esportiva_options: string[];
	conduta_terapeutica_options: string[];
	exames_complementares_options: string[];
	encaminhamentos_options: string[];
	disposicao_options: string[];
	segmentos_por_tipo_lesao: Record<string, string[]>;
	estruturas_por_tipo_segmento: Record<string, Record<string, string[]>>;
	localizacoes_por_tipo_segmento: Record<string, Record<string, string[]>>;
	lateralidade_por_estrutura: Record<string, Lateralidade>;
}

export interface Atendimento {
	id: number;
	data_registro: string;
	cadete_id: number;
	cadete_nr_militar: string;
	cadete_nome_guerra: string;
	medico_id: number;
	atendimento_origem_id: number | null;
	tipo_atendimento: TipoAtendimento;
	tipo_lesao: TipoLesao;
	origem_lesao: OrigemLesao;
	segmento_corporal: string;
	estrutura_anatomica: string;
	localizacao_lesao: string;
	lateralidade: Lateralidade;
	classificacao_atividade: string;
	tipo_atividade: string;
	tfm_taf: string;
	modalidade_esportiva: string;
	conduta_terapeutica: string;
	decisao_sred: DecisaoSred | '';
	estado_fluxo: EstadoFluxoAtendimento;
	prontidao_instrutor: ProntidaoInstrutor;
	medicamentoso: boolean;
	solicitar_exames_complementares: boolean;
	exames_complementares: string[];
	encaminhamentos_multidisciplinares: string[];
	disposicao_cadete: string[];
	notas_clinicas: string;
	flag_sred: boolean;
}

export interface EvolucaoMultidisciplinar {
	id: number;
	atendimento_id: number;
	profissional_id: number;
	parecer_tecnico: string;
	data_evolucao: string;
}

export interface CreateAtendimentoPayload {
	cadete_id: number;
	medico_id: number;
	atendimento_origem_id?: number | null;
	tipo_atendimento: TipoAtendimento;
	tipo_lesao: TipoLesao;
	origem_lesao: OrigemLesao;
	segmento_corporal: string;
	estrutura_anatomica: string;
	localizacao_lesao: string;
	lateralidade: Lateralidade;
	classificacao_atividade?: string;
	tipo_atividade?: string;
	tfm_taf?: string;
	modalidade_esportiva?: string;
	conduta_terapeutica?: string;
	decisao_sred?: DecisaoSred | '';
	medicamentoso?: boolean;
	solicitar_exames_complementares?: boolean;
	exames_complementares?: string[];
	encaminhamentos_multidisciplinares?: string[];
	disposicao_cadete?: string[];
	notas_clinicas?: string;
}

// ---------------------------------------------------------------------------
// Ficha de Avaliação Fisioterapêutica — modelo S-RED
// ---------------------------------------------------------------------------

export type ReatividadeSRED = 'Baixa' | 'Moderada' | 'Alta';

export type EtiologiaSRED =
	| 'Traumática'
	| 'Degenerativa'
	| 'Sobrecarga (Overuse)'
	| 'Pós-operatória'
	| 'Idiopática';

export interface AvaliacaoFisioterapiaSRED {
	id: number;
	atendimento_id: number;
	fisioterapeuta_id: number;
	fisioterapeuta_nome: string;
	cadete_nome: string;
	/** S — Severity */
	gravidade_eva: number;
	limitacao_funcional: string;
	sinais_vermelhos: string;
	/** R — Reactivity */
	reatividade: ReatividadeSRED;
	reatividade_options: ReatividadeSRED[];
	/** E — Etiology */
	etiologia: EtiologiaSRED;
	etiologia_options: EtiologiaSRED[];
	etiologia_complemento: string;
	/** D — Diagnosis */
	diagnostico_clinico: string;
	/** Exame físico */
	inspecao_palpacao: string;
	adm_ativa_graus: string;
	adm_passiva_graus: string;
	teste_forca: string;
	testes_especificos: string;
	/** Plano terapêutico */
	objetivos_tratamento: string;
	plano_tratamento: string;
	liberado_para_pef: boolean;
	liberado_para_pef_em: string | null;
	liberado_para_pef_por: number | null;
	liberado_para_pef_por_username: string;
	observacoes_liberacao_pef: string;
	data_avaliacao: string;
	atualizado_em: string;
}

export interface CreateAvaliacaoFisioterapiaSREDPayload {
	atendimento_id: number;
	fisioterapeuta_id: number;
	gravidade_eva: number;
	limitacao_funcional?: string;
	sinais_vermelhos?: string;
	reatividade: ReatividadeSRED;
	etiologia: EtiologiaSRED;
	etiologia_complemento?: string;
	diagnostico_clinico: string;
	inspecao_palpacao?: string;
	adm_ativa_graus?: string;
	adm_passiva_graus?: string;
	teste_forca?: string;
	testes_especificos?: string;
	objetivos_tratamento?: string;
	plano_tratamento?: string;
	liberado_para_pef?: boolean;
	observacoes_liberacao_pef?: string;
}

export interface CSVPreviewRow {
	linha: number;
	data: string;
	atendimento: string;
	lesao: string;
	parte_corpo: string;
	parte_lesionada: string;
	origem: string;
	erros: string[];
}

export interface CSVPreviewResponse {
	total_linhas: number;
	total_erros: number;
	erros: string[];
	preview: CSVPreviewRow[];
	colunas_detectadas: string[];
}

export interface CSVImportResponse {
	criados: number;
	cadetes_novos: number;
	avisos: string[];
}

export interface AtendimentoFluxoResumo {
	atendimento_id: number;
	estado_fluxo: EstadoFluxoAtendimento;
	sred_ativo: boolean;
	perfis_obrigatorios: string[];
	pendencias: string[];
	prontidao_instrutor: ProntidaoInstrutor;
}

export interface FluxoTransicaoPayload {
	estado_destino: EstadoFluxoAtendimento;
}

export interface FluxoTransicaoResponse {
	atendimento: Atendimento;
	pendencias: string[];
}

export interface NotaCampoInstrutor {
	id: number;
	atendimento_id: number;
	instrutor_id: number;
	instrutor_username: string;
	nota_campo: string;
	situacao_final: SituacaoFinalInstrutor | '';
	sugestao_administrativa: string;
	criado_em: string;
	atualizado_em: string;
}

export interface CreateNotaCampoInstrutorPayload {
	nota_campo: string;
	situacao_final?: SituacaoFinalInstrutor | '';
	sugestao_administrativa?: string;
}

export interface DecisaoFinalInstrutorPayload {
	situacao_final: SituacaoFinalInstrutor;
	nota_campo: string;
	sugestao_administrativa?: string;
}

export type CargaStatus = 'SUCESSO' | 'SEM_ALTERACAO' | 'FALHA';
export type CargaHistoricoOrderBy = 'id' | 'status' | 'criado_em';
export type CargaHistoricoOrderDir = 'asc' | 'desc';

export interface CargaHistoricoResumo {
	sac_carregados?: number;
	sac_criados?: number;
	sac_atualizados?: number;
	sac_inalterados?: number;
	referencias_lesao_carregadas?: number;
	aplicado?: boolean;
}

export interface CargaHistoricoItem {
	id: number;
	status: CargaStatus;
	reset: boolean;
	force: boolean;
	arquivos_alterados: string[];
	resumo: CargaHistoricoResumo;
	mensagem: string;
	criado_em: string;
}

export interface CargaHistoricoResponse {
	items: CargaHistoricoItem[];
	pagination: {
		total: number;
		page: number;
		page_size: number;
		total_pages: number;
		has_previous: boolean;
		has_next: boolean;
	};
	ordering: {
		order_by: CargaHistoricoOrderBy;
		order_dir: CargaHistoricoOrderDir;
	};
}

export interface HistoricoCargaFiltros {
	page?: number;
	page_size?: number;
	status?: CargaStatus;
	data_inicio?: string;
	data_fim?: string;
	order_by?: CargaHistoricoOrderBy;
	order_dir?: CargaHistoricoOrderDir;
}

export interface ExecutarCargaPayload {
	reset: boolean;
	force: boolean;
}

export interface ExecutarCargaResponse {
	historico_id: number | null;
	status: CargaStatus;
	reset_aplicado: boolean;
	force_aplicado: boolean;
	aplicado: boolean;
	arquivos_alterados: string[];
	sac_carregados: number;
	sac_criados?: number;
	sac_atualizados?: number;
	referencias_lesao_carregadas: number;
}

import { apiClient } from './apiClient';
import type {
	CargaHistoricoResponse,
	ExecutarCargaPayload,
	ExecutarCargaResponse,
	HistoricoCargaFiltros,
} from '../types/cargaReferencias';

const RESOURCE_CARGA = '/saude/carga-referencias/';
const RESOURCE_HISTORICO = '/saude/carga-referencias/historico/';

export const listHistoricoCarga = async (
	filtros: HistoricoCargaFiltros = {},
): Promise<CargaHistoricoResponse> => {
	const params: Record<string, string | number> = {
		page: filtros.page ?? 1,
		page_size: filtros.page_size ?? 20,
		order_by: filtros.order_by ?? 'criado_em',
		order_dir: filtros.order_dir ?? 'desc',
	};

	if (filtros.status) {
		params.status = filtros.status;
	}
	if (filtros.data_inicio) {
		params.data_inicio = filtros.data_inicio;
	}
	if (filtros.data_fim) {
		params.data_fim = filtros.data_fim;
	}

	const { data } = await apiClient.get<CargaHistoricoResponse>(RESOURCE_HISTORICO, {
		params,
	});

	const items = Array.isArray(data.items) ? data.items : [];

	return {
		items,
		pagination: data.pagination ?? {
			total: items.length,
			page: filtros.page ?? 1,
			page_size: filtros.page_size ?? 20,
			total_pages: items.length > 0 ? 1 : 0,
			has_previous: false,
			has_next: false,
		},
		ordering: data.ordering ?? {
			order_by: filtros.order_by ?? 'criado_em',
			order_dir: filtros.order_dir ?? 'desc',
		},
	};
};

export const executarCargaReferencias = async (
	payload: ExecutarCargaPayload,
): Promise<ExecutarCargaResponse> => {
	const { data } = await apiClient.post<ExecutarCargaResponse>(RESOURCE_CARGA, payload);
	return data;
};

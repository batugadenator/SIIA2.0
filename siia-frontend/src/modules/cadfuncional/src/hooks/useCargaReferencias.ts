import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	executarCargaReferencias,
	listHistoricoCarga,
} from '../services/cargaReferencias.service';
import type {
	CargaHistoricoResponse,
	ExecutarCargaPayload,
	ExecutarCargaResponse,
	HistoricoCargaFiltros,
} from '../types/cargaReferencias';

const QUERY_KEY_HISTORICO_CARGA = ['historico-carga-referencias'];

export const useHistoricoCargaReferencias = (filtros: HistoricoCargaFiltros = {}) => {
	const page = filtros.page ?? 1;
	const pageSize = filtros.page_size ?? 20;
	const status = filtros.status ?? '';
	const dataInicio = filtros.data_inicio ?? '';
	const dataFim = filtros.data_fim ?? '';
	const orderBy = filtros.order_by ?? 'criado_em';
	const orderDir = filtros.order_dir ?? 'desc';

	return useQuery<CargaHistoricoResponse>({
		queryKey: [
			...QUERY_KEY_HISTORICO_CARGA,
			page,
			pageSize,
			status,
			dataInicio,
			dataFim,
			orderBy,
			orderDir,
		],
		queryFn: () => listHistoricoCarga(filtros),
	});
};

export const useExecutarCargaReferencias = () => {
	const queryClient = useQueryClient();

	return useMutation<ExecutarCargaResponse, unknown, ExecutarCargaPayload>({
		mutationFn: (payload) => executarCargaReferencias(payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: QUERY_KEY_HISTORICO_CARGA,
			});
		},
	});
};

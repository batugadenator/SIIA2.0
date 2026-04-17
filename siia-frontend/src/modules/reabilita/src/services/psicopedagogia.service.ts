import { apiClient } from './apiClient';
import { ensureCsrfToken } from './auth.service';
import type {
	CreateIntervencaoPsicopedagogicaPayload,
	IntervencaoPsicopedagogica,
	SredResumoCompartilhadoResponse,
} from '../types/psicopedagogia';

const RESOURCE_INTERVENCOES_PSICO = '/saude/psicopedagogia/intervencoes/';
const RESOURCE_SRED_RESUMO_COMPARTILHADO = '/saude/sred/resumo-compartilhado/';

export const listIntervencoesPsicopedagogicas = async (
	atendimentoId?: number,
): Promise<IntervencaoPsicopedagogica[]> => {
	const params = atendimentoId ? { atendimento_id: atendimentoId } : {};
	const { data } = await apiClient.get<IntervencaoPsicopedagogica[] | { results: IntervencaoPsicopedagogica[] }>(
		RESOURCE_INTERVENCOES_PSICO,
		{ params },
	);

	if (Array.isArray(data)) {
		return data;
	}

	return data.results;
};

export const createIntervencaoPsicopedagogica = async (
	payload: CreateIntervencaoPsicopedagogicaPayload,
): Promise<IntervencaoPsicopedagogica> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<IntervencaoPsicopedagogica>(RESOURCE_INTERVENCOES_PSICO, payload);
	return data;
};

export const getSredResumoCompartilhado = async (
	atendimentoId: number,
): Promise<SredResumoCompartilhadoResponse> => {
	const { data } = await apiClient.get<SredResumoCompartilhadoResponse>(RESOURCE_SRED_RESUMO_COMPARTILHADO, {
		params: { atendimento_id: atendimentoId },
	});
	return data;
};

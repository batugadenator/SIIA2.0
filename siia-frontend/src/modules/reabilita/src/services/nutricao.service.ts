import { apiClient } from './apiClient';
import { ensureCsrfToken } from './auth.service';
import type { AvaliacaoNutricional, CreateAvaliacaoNutricionalPayload } from '../types/nutricao';

const RESOURCE_NUTRICAO_AVALIACOES = '/saude/nutricao/avaliacoes/';

export const listAvaliacoesNutricionais = async (): Promise<AvaliacaoNutricional[]> => {
	const { data } = await apiClient.get<AvaliacaoNutricional[] | { results: AvaliacaoNutricional[] }>(
		RESOURCE_NUTRICAO_AVALIACOES,
	);

	if (Array.isArray(data)) {
		return data;
	}

	return data.results;
};

export const createAvaliacaoNutricional = async (
	payload: CreateAvaliacaoNutricionalPayload,
): Promise<AvaliacaoNutricional> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<AvaliacaoNutricional>(RESOURCE_NUTRICAO_AVALIACOES, payload);
	return data;
};

import { apiClient } from './apiClient';
import { ensureCsrfToken } from './auth.service';
import type {
	CreateSessaoTreinoPEFPayload,
	EducacaoFisicaEvolucaoCargaResponse,
	SessaoTreinoPEF,
} from '../types/educacaoFisica';

const RESOURCE_SESSOES_TREINO_PEF = '/saude/educacao-fisica/sessoes-treino/';
const RESOURCE_EVOLUCAO_CARGA_PEF = '/saude/educacao-fisica/evolucao-carga/';

export const listSessoesTreinoPEF = async (atendimentoId?: number): Promise<SessaoTreinoPEF[]> => {
	const params = atendimentoId ? { atendimento_id: atendimentoId } : {};
	const { data } = await apiClient.get<SessaoTreinoPEF[] | { results: SessaoTreinoPEF[] }>(
		RESOURCE_SESSOES_TREINO_PEF,
		{ params },
	);

	if (Array.isArray(data)) {
		return data;
	}

	return data.results;
};

export const createSessaoTreinoPEF = async (
	payload: CreateSessaoTreinoPEFPayload,
): Promise<SessaoTreinoPEF> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<SessaoTreinoPEF>(RESOURCE_SESSOES_TREINO_PEF, payload);
	return data;
};

export const getEducacaoFisicaEvolucaoCarga = async (
	atendimentoId: number,
): Promise<EducacaoFisicaEvolucaoCargaResponse> => {
	const { data } = await apiClient.get<EducacaoFisicaEvolucaoCargaResponse>(RESOURCE_EVOLUCAO_CARGA_PEF, {
		params: { atendimento_id: atendimentoId },
	});
	return data;
};

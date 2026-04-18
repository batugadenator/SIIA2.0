import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	createSessaoTreinoPEF,
	getEducacaoFisicaEvolucaoCarga,
	listSessoesTreinoPEF,
} from '../services/educacaoFisica.service';
import type {
	CreateSessaoTreinoPEFPayload,
	EducacaoFisicaEvolucaoCargaResponse,
	SessaoTreinoPEF,
} from '../types/educacaoFisica';

const QUERY_KEY_SESSOES_TREINO_PEF = (atendimentoId?: number) =>
	atendimentoId ? ['educacao-fisica-sessoes', atendimentoId] : ['educacao-fisica-sessoes'];
const QUERY_KEY_EVOLUCAO_CARGA_PEF = (atendimentoId?: number) =>
	atendimentoId ? ['educacao-fisica-evolucao', atendimentoId] : ['educacao-fisica-evolucao'];

export const useSessoesTreinoPEF = (atendimentoId?: number) => {
	return useQuery<SessaoTreinoPEF[]>({
		queryKey: QUERY_KEY_SESSOES_TREINO_PEF(atendimentoId),
		queryFn: () => listSessoesTreinoPEF(atendimentoId),
	});
};

export const useCreateSessaoTreinoPEF = (atendimentoId?: number) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateSessaoTreinoPEFPayload) => createSessaoTreinoPEF(payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_SESSOES_TREINO_PEF(atendimentoId) });
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_EVOLUCAO_CARGA_PEF(atendimentoId) });
			await queryClient.invalidateQueries({ queryKey: ['atendimento-fluxo', atendimentoId] });
			await queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
		},
	});
};

export const useEducacaoFisicaEvolucaoCarga = (atendimentoId?: number) => {
	return useQuery<EducacaoFisicaEvolucaoCargaResponse>({
		queryKey: QUERY_KEY_EVOLUCAO_CARGA_PEF(atendimentoId),
		queryFn: () => getEducacaoFisicaEvolucaoCarga(atendimentoId as number),
		enabled: Boolean(atendimentoId),
	});
};

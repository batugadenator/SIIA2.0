import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createAvaliacaoNutricional, listAvaliacoesNutricionais } from '../services/nutricao.service';
import type { AvaliacaoNutricional, CreateAvaliacaoNutricionalPayload } from '../types/nutricao';

const QUERY_KEY_AVALIACOES_NUTRICIONAIS = ['nutricao-avaliacoes'];

export const useAvaliacoesNutricionais = () => {
	return useQuery<AvaliacaoNutricional[]>({
		queryKey: QUERY_KEY_AVALIACOES_NUTRICIONAIS,
		queryFn: listAvaliacoesNutricionais,
	});
};

export const useCreateAvaliacaoNutricional = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateAvaliacaoNutricionalPayload) => createAvaliacaoNutricional(payload),
		onSuccess: async (_data, variables) => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_AVALIACOES_NUTRICIONAIS });
			await queryClient.invalidateQueries({ queryKey: ['atendimento-fluxo', variables.atendimento_id] });
			await queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
		},
	});
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	createIntervencaoPsicopedagogica,
	getSredResumoCompartilhado,
	listIntervencoesPsicopedagogicas,
} from '../services/psicopedagogia.service';
import type {
	CreateIntervencaoPsicopedagogicaPayload,
	IntervencaoPsicopedagogica,
	SredResumoCompartilhadoResponse,
} from '../types/psicopedagogia';

const QUERY_KEY_INTERVENCOES_PSICO = (atendimentoId?: number) =>
	atendimentoId ? ['psicopedagogia-intervencoes', atendimentoId] : ['psicopedagogia-intervencoes'];
const QUERY_KEY_SRED_RESUMO = (atendimentoId?: number) =>
	atendimentoId ? ['sred-resumo-compartilhado', atendimentoId] : ['sred-resumo-compartilhado'];

export const useIntervencoesPsicopedagogicas = (atendimentoId?: number) => {
	return useQuery<IntervencaoPsicopedagogica[]>({
		queryKey: QUERY_KEY_INTERVENCOES_PSICO(atendimentoId),
		queryFn: () => listIntervencoesPsicopedagogicas(atendimentoId),
	});
};

export const useCreateIntervencaoPsicopedagogica = (atendimentoId?: number) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateIntervencaoPsicopedagogicaPayload) => createIntervencaoPsicopedagogica(payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_INTERVENCOES_PSICO(atendimentoId) });
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_SRED_RESUMO(atendimentoId) });
			await queryClient.invalidateQueries({ queryKey: ['atendimento-fluxo', atendimentoId] });
			await queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
		},
	});
};

export const useSredResumoCompartilhado = (atendimentoId?: number) => {
	return useQuery<SredResumoCompartilhadoResponse>({
		queryKey: QUERY_KEY_SRED_RESUMO(atendimentoId),
		queryFn: () => getSredResumoCompartilhado(atendimentoId as number),
		enabled: Boolean(atendimentoId),
	});
};

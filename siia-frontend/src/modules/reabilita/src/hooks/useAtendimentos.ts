import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	createAtendimentoNotaInstrutor,
	createAtendimento,
	createAvaliacaoFisioterapiaSRED,
	getAtendimentoFluxoResumo,
	getAtendimentoReferencias,
	listAtendimentoNotasInstrutor,
	listAvaliacoesFisioterapiaSRED,
	listEvolucoesMultidisciplinares,
	listAtendimentos,
	postAtendimentoDecisaoFinalInstrutor,
	postAtendimentoFluxoTransicao,
	updateAvaliacaoFisioterapiaSRED,
} from '../services/atendimentos.service';
import type {
	Atendimento,
	AtendimentoFluxoResumo,
	AtendimentoReferenciasResponse,
	AvaliacaoFisioterapiaSRED,
	CreateNotaCampoInstrutorPayload,
	CreateAtendimentoPayload,
	CreateAvaliacaoFisioterapiaSREDPayload,
	DecisaoFinalInstrutorPayload,
	EvolucaoMultidisciplinar,
	EstadoFluxoAtendimento,
	NotaCampoInstrutor,
} from '../types/atendimento';

const QUERY_KEY_ATENDIMENTOS = ['atendimentos'];
const QUERY_KEY_ATENDIMENTO_REFERENCIAS = ['atendimentos-referencias'];
const QUERY_KEY_EVOLUCOES_MULTIDISCIPLINARES = ['evolucoes-multidisciplinares'];

export const useAtendimentos = () => {
	return useQuery<Atendimento[]>({
		queryKey: QUERY_KEY_ATENDIMENTOS,
		queryFn: listAtendimentos,
	});
};

export const useAtendimentoReferencias = () => {
	return useQuery<AtendimentoReferenciasResponse>({
		queryKey: QUERY_KEY_ATENDIMENTO_REFERENCIAS,
		queryFn: getAtendimentoReferencias,
	});
};

export const useEvolucoesMultidisciplinares = () => {
	return useQuery<EvolucaoMultidisciplinar[]>({
		queryKey: QUERY_KEY_EVOLUCOES_MULTIDISCIPLINARES,
		queryFn: listEvolucoesMultidisciplinares,
	});
};

export const useCreateAtendimento = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateAtendimentoPayload) => createAtendimento(payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_ATENDIMENTOS });
		},
	});
};

const QUERY_KEY_AVALIACOES_SRED = (atendimentoId?: number) =>
	atendimentoId ? ['avaliacoes-sred', atendimentoId] : ['avaliacoes-sred'];
const QUERY_KEY_FLUXO_ATENDIMENTO = (atendimentoId?: number) =>
	atendimentoId ? ['atendimento-fluxo', atendimentoId] : ['atendimento-fluxo'];
const QUERY_KEY_NOTAS_INSTRUTOR = (atendimentoId?: number) =>
	atendimentoId ? ['instrutor-notas', atendimentoId] : ['instrutor-notas'];

export const useAvaliacoesFisioterapiaSRED = (atendimentoId?: number) => {
	return useQuery<AvaliacaoFisioterapiaSRED[]>({
		queryKey: QUERY_KEY_AVALIACOES_SRED(atendimentoId),
		queryFn: () => listAvaliacoesFisioterapiaSRED(atendimentoId),
	});
};

export const useCreateAvaliacaoFisioterapiaSRED = () => {
	const queryClient = useQueryClient();
	return useMutation<AvaliacaoFisioterapiaSRED, unknown, CreateAvaliacaoFisioterapiaSREDPayload>({
		mutationFn: createAvaliacaoFisioterapiaSRED,
		onSuccess: async (data) => {
			void queryClient.invalidateQueries({ queryKey: QUERY_KEY_AVALIACOES_SRED(data.atendimento_id) });
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_FLUXO_ATENDIMENTO(data.atendimento_id) });
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_ATENDIMENTOS });
		},
	});
};

export const useUpdateAvaliacaoFisioterapiaSRED = (id: number) => {
	const queryClient = useQueryClient();
	return useMutation<AvaliacaoFisioterapiaSRED, unknown, Partial<CreateAvaliacaoFisioterapiaSREDPayload>>({
		mutationFn: (payload) => updateAvaliacaoFisioterapiaSRED(id, payload),
		onSuccess: async (data) => {
			void queryClient.invalidateQueries({ queryKey: QUERY_KEY_AVALIACOES_SRED(data.atendimento_id) });
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_FLUXO_ATENDIMENTO(data.atendimento_id) });
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_ATENDIMENTOS });
		},
	});
};

export const useAtendimentoFluxoResumo = (atendimentoId?: number) => {
	return useQuery<AtendimentoFluxoResumo>({
		queryKey: QUERY_KEY_FLUXO_ATENDIMENTO(atendimentoId),
		queryFn: () => getAtendimentoFluxoResumo(atendimentoId as number),
		enabled: Boolean(atendimentoId),
	});
};

export const useAtendimentoNotasInstrutor = (atendimentoId?: number) => {
	return useQuery<NotaCampoInstrutor[]>({
		queryKey: QUERY_KEY_NOTAS_INSTRUTOR(atendimentoId),
		queryFn: () => listAtendimentoNotasInstrutor(atendimentoId as number),
		enabled: Boolean(atendimentoId),
	});
};

export const useAtendimentoFluxoTransicao = (atendimentoId?: number) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (estadoDestino: EstadoFluxoAtendimento) =>
			postAtendimentoFluxoTransicao(atendimentoId as number, { estado_destino: estadoDestino }),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_FLUXO_ATENDIMENTO(atendimentoId) });
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_ATENDIMENTOS });
		},
	});
};

export const useCreateAtendimentoNotaInstrutor = (atendimentoId?: number) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateNotaCampoInstrutorPayload) =>
			createAtendimentoNotaInstrutor(atendimentoId as number, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTAS_INSTRUTOR(atendimentoId) });
		},
	});
};

export const useAtendimentoDecisaoFinalInstrutor = (atendimentoId?: number) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: DecisaoFinalInstrutorPayload) =>
			postAtendimentoDecisaoFinalInstrutor(atendimentoId as number, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_NOTAS_INSTRUTOR(atendimentoId) });
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_FLUXO_ATENDIMENTO(atendimentoId) });
		},
	});
};

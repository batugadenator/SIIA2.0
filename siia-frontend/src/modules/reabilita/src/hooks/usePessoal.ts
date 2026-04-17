import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	bulkCreateMilitaresCsv,
	createMilitar,
	listMilitares,
	listProfissionaisSaude,
} from '../services/pessoal.service';
import type { BulkCsvResult, CreateMilitarPayload, Militar, ProfissionalSaude } from '../types/pessoal';

const QUERY_KEY_MILITARES = ['militares'];
const QUERY_KEY_PROFISSIONAIS = ['profissionais-saude'];

export const useMilitares = () => {
	return useQuery<Militar[]>({
		queryKey: QUERY_KEY_MILITARES,
		queryFn: listMilitares,
	});
};

export const useCreateMilitar = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateMilitarPayload) => createMilitar(payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_MILITARES });
		},
	});
};

export const useProfissionaisSaude = () => {
	return useQuery<ProfissionalSaude[]>({
		queryKey: QUERY_KEY_PROFISSIONAIS,
		queryFn: listProfissionaisSaude,
	});
};

export const useBulkCreateMilitaresCsv = () => {
	const queryClient = useQueryClient();

	return useMutation<BulkCsvResult, unknown, File>({
		mutationFn: (file: File) => bulkCreateMilitaresCsv(file),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: QUERY_KEY_MILITARES });
		},
	});
};

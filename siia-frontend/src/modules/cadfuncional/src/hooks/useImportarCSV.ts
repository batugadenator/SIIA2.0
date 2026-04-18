import { useMutation, useQueryClient } from '@tanstack/react-query';

import { confirmarCSVImport, previewCSVImport } from '../services/atendimentos.service';
import type { CSVImportResponse, CSVPreviewResponse } from '../types/atendimento';

export const usePreviewCSV = () => {
	return useMutation<CSVPreviewResponse, Error, File>({
		mutationFn: previewCSVImport,
	});
};

export const useConfirmarCSV = () => {
	const queryClient = useQueryClient();

	return useMutation<CSVImportResponse, Error, File>({
		mutationFn: confirmarCSVImport,
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
		},
	});
};

import { apiClient } from './apiClient';
import { ensureCsrfToken } from './auth.service';
import type {
	BulkCsvResult,
	CreateMilitarPayload,
	Militar,
	ProfissionalSaude,
} from '../types/pessoal';

const RESOURCE_MILITARES = '/pessoal/militares/';
const RESOURCE_PROFISSIONAIS = '/pessoal/profissionais-saude/';

const toArrayResult = <T>(data: T[] | { results: T[] }): T[] => {
	if (Array.isArray(data)) {
		return data;
	}
	return Array.isArray(data.results) ? data.results : [];
};

export const listMilitares = async (): Promise<Militar[]> => {
	const { data } = await apiClient.get<Militar[] | { results: Militar[] }>(RESOURCE_MILITARES);
	return toArrayResult(data);
};

export const createMilitar = async (payload: CreateMilitarPayload): Promise<Militar> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<Militar>(RESOURCE_MILITARES, payload);
	return data;
};

export const listProfissionaisSaude = async (): Promise<ProfissionalSaude[]> => {
	const { data } = await apiClient.get<ProfissionalSaude[] | { results: ProfissionalSaude[] }>(RESOURCE_PROFISSIONAIS);
	return toArrayResult(data);
};

export const bulkCreateMilitaresCsv = async (file: File): Promise<BulkCsvResult> => {
	await ensureCsrfToken();
	const formData = new FormData();
	formData.append('arquivo', file);
	const { data } = await apiClient.post<BulkCsvResult>(
		`${RESOURCE_MILITARES}bulk-csv/`,
		formData,
		{ headers: { 'Content-Type': 'multipart/form-data' } },
	);
	return data;
};

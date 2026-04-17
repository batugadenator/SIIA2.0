import { apiClient } from './apiClient';
import { ensureCsrfToken } from './auth.service';
import type {
	Atendimento,
	AtendimentoFluxoResumo,
	AtendimentoReferenciasResponse,
	AvaliacaoFisioterapiaSRED,
	CreateNotaCampoInstrutorPayload,
	CreateAtendimentoPayload,
	CreateAvaliacaoFisioterapiaSREDPayload,
	CSVImportResponse,
	CSVPreviewResponse,
	DecisaoFinalInstrutorPayload,
	EvolucaoMultidisciplinar,
	FluxoTransicaoPayload,
	FluxoTransicaoResponse,
	NotaCampoInstrutor,
} from '../types/atendimento';

const RESOURCE = '/saude/atendimentos/';
const RESOURCE_REFERENCIAS = '/saude/atendimentos/referencias/';
const RESOURCE_EVOLUCOES = '/saude/evolucoes/';
const RESOURCE_CSV_PREVIEW = '/saude/importar-csv/preview/';
const RESOURCE_CSV_CONFIRMAR = '/saude/importar-csv/confirmar/';
const RESOURCE_AVALIACOES_SRED = '/saude/fisioterapia/avaliacoes-sred/';

export const listAtendimentos = async (): Promise<Atendimento[]> => {
	const { data } = await apiClient.get<Atendimento[] | { results: Atendimento[] }>(RESOURCE);
	if (Array.isArray(data)) {
		return data;
	}
	return data.results;
};

export const createAtendimento = async (
	payload: CreateAtendimentoPayload,
): Promise<Atendimento> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<Atendimento>(RESOURCE, payload);
	return data;
};

export const getAtendimentoReferencias = async (): Promise<AtendimentoReferenciasResponse> => {
	const { data } = await apiClient.get<AtendimentoReferenciasResponse>(RESOURCE_REFERENCIAS);
	return data;
};

export const listEvolucoesMultidisciplinares = async (): Promise<EvolucaoMultidisciplinar[]> => {
	const { data } = await apiClient.get<EvolucaoMultidisciplinar[] | { results: EvolucaoMultidisciplinar[] }>(
		RESOURCE_EVOLUCOES,
	);

	if (Array.isArray(data)) {
		return data;
	}

	return data.results;
};

export const previewCSVImport = async (file: File): Promise<CSVPreviewResponse> => {
	const form = new FormData();
	form.append('arquivo', file);
	const { data } = await apiClient.post<CSVPreviewResponse>(RESOURCE_CSV_PREVIEW, form, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	return data;
};

export const confirmarCSVImport = async (file: File): Promise<CSVImportResponse> => {
	const form = new FormData();
	form.append('arquivo', file);
	const { data } = await apiClient.post<CSVImportResponse>(RESOURCE_CSV_CONFIRMAR, form, {
		headers: { 'Content-Type': 'multipart/form-data' },
	});
	return data;
};

export const listAvaliacoesFisioterapiaSRED = async (
	atendimentoId?: number,
): Promise<AvaliacaoFisioterapiaSRED[]> => {
	const params = atendimentoId ? { atendimento_id: atendimentoId } : {};
	const { data } = await apiClient.get<AvaliacaoFisioterapiaSRED[] | { results: AvaliacaoFisioterapiaSRED[] }>(
		RESOURCE_AVALIACOES_SRED,
		{ params },
	);
	return Array.isArray(data) ? data : data.results;
};

export const createAvaliacaoFisioterapiaSRED = async (
	payload: CreateAvaliacaoFisioterapiaSREDPayload,
): Promise<AvaliacaoFisioterapiaSRED> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<AvaliacaoFisioterapiaSRED>(RESOURCE_AVALIACOES_SRED, payload);
	return data;
};

export const updateAvaliacaoFisioterapiaSRED = async (
	id: number,
	payload: Partial<CreateAvaliacaoFisioterapiaSREDPayload>,
): Promise<AvaliacaoFisioterapiaSRED> => {
	await ensureCsrfToken();
	const { data } = await apiClient.patch<AvaliacaoFisioterapiaSRED>(`${RESOURCE_AVALIACOES_SRED}${id}/`, payload);
	return data;
};

export const getAtendimentoFluxoResumo = async (atendimentoId: number): Promise<AtendimentoFluxoResumo> => {
	const { data } = await apiClient.get<AtendimentoFluxoResumo>(`${RESOURCE}${atendimentoId}/fluxo/`);
	return data;
};

export const postAtendimentoFluxoTransicao = async (
	atendimentoId: number,
	payload: FluxoTransicaoPayload,
): Promise<FluxoTransicaoResponse> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<FluxoTransicaoResponse>(`${RESOURCE}${atendimentoId}/fluxo/transicao/`, payload);
	return data;
};

export const listAtendimentoNotasInstrutor = async (atendimentoId: number): Promise<NotaCampoInstrutor[]> => {
	const { data } = await apiClient.get<NotaCampoInstrutor[]>(`${RESOURCE}${atendimentoId}/instrutor/notas/`);
	return data;
};

export const createAtendimentoNotaInstrutor = async (
	atendimentoId: number,
	payload: CreateNotaCampoInstrutorPayload,
): Promise<NotaCampoInstrutor> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<NotaCampoInstrutor>(`${RESOURCE}${atendimentoId}/instrutor/notas/`, payload);
	return data;
};

export const postAtendimentoDecisaoFinalInstrutor = async (
	atendimentoId: number,
	payload: DecisaoFinalInstrutorPayload,
): Promise<NotaCampoInstrutor> => {
	await ensureCsrfToken();
	const { data } = await apiClient.post<NotaCampoInstrutor>(`${RESOURCE}${atendimentoId}/instrutor/decisao-final/`, payload);
	return data;
};

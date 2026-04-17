import { apiClient } from './apiClient';
import type { PainelClinicoResponse } from '../types/painelClinico';

const RESOURCE = '/estatistica/painel-clinico/';

export const getPainelClinico = async (): Promise<PainelClinicoResponse> => {
	const { data } = await apiClient.get<PainelClinicoResponse>(RESOURCE);
	return data;
};

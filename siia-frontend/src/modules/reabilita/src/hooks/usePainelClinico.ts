import { useQuery } from '@tanstack/react-query';

import { getPainelClinico } from '../services/painelClinico.service';
import type { PainelClinicoResponse } from '../types/painelClinico';

const QUERY_KEY_PAINEL_CLINICO = ['painel-clinico'];

export const usePainelClinico = () => {
	return useQuery<PainelClinicoResponse>({
		queryKey: QUERY_KEY_PAINEL_CLINICO,
		queryFn: getPainelClinico,
		refetchOnMount: 'always',
	});
};

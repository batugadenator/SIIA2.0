export interface Militar {
	id: number;
	nr_militar: string;
	matricula: string;
	nome_completo: string;
	nome_guerra: string;
	sexo: string;
	turma: string;
	ano: string;
	posto_graduacao: string;
	arma_quadro_servico: string;
	curso: string;
	companhia: string;
	pelotao: string;
	is_instrutor: boolean;
}

export interface CreateMilitarPayload {
	nr_militar: string;
	matricula?: string;
	nome_completo: string;
	nome_guerra?: string;
	sexo?: string;
	turma?: string;
	ano?: string;
	posto_graduacao?: string;
	arma_quadro_servico?: string;
	curso?: string;
	companhia?: string;
	pelotao?: string;
	is_instrutor?: boolean;
}

export interface ProfissionalSaude {
	id: number;
	militar: number;
	especialidade: string;
	registro_profissional: string;
	ativo: boolean;
}

export interface BulkCsvErro {
	linha: number;
	erro: string | Record<string, string[]>;
}

export interface BulkCsvResult {
	total_enviados: number;
	total_criados: number;
	total_atualizados: number;
	total_sem_alteracao: number;
	total_erros: number;
	criados: Militar[];
	atualizados: Militar[];
	erros: BulkCsvErro[];
}

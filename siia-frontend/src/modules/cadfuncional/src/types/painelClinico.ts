export interface PainelClinicoMetricas {
	cadetes: number;
	atendimentos: number;
	atendimentos_homens: number;
	atendimentos_mulheres: number;
	por_data: number;
	retornos: number;
}

export interface PainelClinicoAtendimentoMes {
	mes: string;
	total: number;
}

export interface PainelClinicoEncaminhamento {
	perfil: string;
	percentual: number;
	total: number;
}

export interface PainelClinicoUltimoAtendimento {
	cadete: string;
	data: string;
	tipo: string;
	lesao: string;
	conduta: string;
}

export interface PainelClinicoAtendimentoInicialAnalitico {
	ano: string;
	curso: string;
	sexo: string;
	atividade: string;
}

export interface PainelClinicoResponse {
	metricas: PainelClinicoMetricas;
	atendimentos_ultimos_6_meses: PainelClinicoAtendimentoMes[];
	encaminhamentos_por_perfil: PainelClinicoEncaminhamento[];
	ultimos_atendimentos: PainelClinicoUltimoAtendimento[];
	atendimentos_iniciais_analitico: PainelClinicoAtendimentoInicialAnalitico[];
}

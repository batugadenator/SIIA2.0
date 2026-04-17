import { api } from "./api";

export type SiaggArea = {
  id: number;
  nome: string;
  slug: string;
  descricao: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type SiaggDataEntry = {
  id: number;
  area: number;
  titulo: string;
  valor: string;
  data_referencia: string;
  observacao: string;
  operador: number | null;
  criado_em: string;
  atualizado_em: string;
};

export type SiaggReportFile = {
  id: number;
  report: number;
  arquivo: string;
  enviado_por: number | null;
  criado_em: string;
};

export type SiaggReport = {
  id: number;
  area: number;
  titulo: string;
  descricao: string;
  data_referencia: string;
  autor: number | null;
  criado_em: string;
  atualizado_em: string;
  arquivos: SiaggReportFile[];
};

export type SiaggGovernanceDocument = {
  id: number;
  titulo: string;
  descricao: string;
  categoria: string;
  arquivo: string;
  enviado_por: number | null;
  criado_em: string;
};

export type PncpCategoria = {
  name: string;
  value: number;
  quantity: number;
};

export type PncpSummary = {
  ano: number;
  cnpj: string;
  total_itens: number;
  valor_total: number;
  quantidade_categorias: number;
  categorias: PncpCategoria[];
  atualizado_em: string;
  fonte: string;
};

export async function fetchSiaggAreas(): Promise<SiaggArea[]> {
  const { data } = await api.get<SiaggArea[]>("/siagg/areas/");
  return data;
}

export async function fetchSiaggDataEntries(filters?: {
  areaId?: number;
  dataInicio?: string;
  dataFim?: string;
}): Promise<SiaggDataEntry[]> {
  const params: Record<string, string | number> = {};

  if (filters?.areaId) {
    params.area_id = filters.areaId;
  }
  if (filters?.dataInicio) {
    params.data_inicio = filters.dataInicio;
  }
  if (filters?.dataFim) {
    params.data_fim = filters.dataFim;
  }

  const { data } = await api.get<SiaggDataEntry[]>("/siagg/data-entries/", { params });
  return data;
}

export async function fetchSiaggReports(filters?: {
  areaId?: number;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
}): Promise<SiaggReport[]> {
  const params: Record<string, string | number> = {};

  if (filters?.areaId) {
    params.area_id = filters.areaId;
  }
  if (filters?.dataInicio) {
    params.data_inicio = filters.dataInicio;
  }
  if (filters?.dataFim) {
    params.data_fim = filters.dataFim;
  }
  if (filters?.search) {
    params.search = filters.search;
  }

  const { data } = await api.get<SiaggReport[]>("/siagg/reports/", { params });
  return data;
}

export async function createSiaggReport(payload: {
  area: number;
  titulo: string;
  descricao: string;
  data_referencia: string;
}): Promise<SiaggReport> {
  const { data } = await api.post<SiaggReport>("/siagg/reports/", payload);
  return data;
}

export async function uploadSiaggReportFile(reportId: number, file: File): Promise<SiaggReportFile> {
  const formData = new FormData();
  formData.append("arquivo", file);

  const { data } = await api.post<SiaggReportFile>(`/siagg/reports/${reportId}/arquivos/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function fetchSiaggGovernanceDocuments(filters?: {
  categoria?: string;
  search?: string;
  dataInicio?: string;
  dataFim?: string;
}): Promise<SiaggGovernanceDocument[]> {
  const params: Record<string, string> = {};

  if (filters?.categoria) {
    params.categoria = filters.categoria;
  }
  if (filters?.search) {
    params.search = filters.search;
  }
  if (filters?.dataInicio) {
    params.data_inicio = filters.dataInicio;
  }
  if (filters?.dataFim) {
    params.data_fim = filters.dataFim;
  }

  const { data } = await api.get<SiaggGovernanceDocument[]>("/siagg/governance-documents/", { params });
  return data;
}

export async function uploadSiaggGovernanceDocument(payload: {
  titulo: string;
  descricao: string;
  categoria: string;
  arquivo: File;
}): Promise<SiaggGovernanceDocument> {
  const formData = new FormData();
  formData.append("titulo", payload.titulo);
  formData.append("descricao", payload.descricao);
  formData.append("categoria", payload.categoria);
  formData.append("arquivo", payload.arquivo);

  const { data } = await api.post<SiaggGovernanceDocument>("/siagg/governance-documents/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}

export async function fetchPncpSummary(cnpj: string, ano: number): Promise<PncpSummary> {
  const { data } = await api.get<PncpSummary>("/siagg/pncp/pca-summary/", {
    params: { cnpj, ano },
  });
  return data;
}

export async function refreshPncpSummary(cnpj: string, ano: number): Promise<PncpSummary> {
  const { data } = await api.post<PncpSummary>("/siagg/pncp/pca-summary/", { cnpj, ano });
  return data;
}

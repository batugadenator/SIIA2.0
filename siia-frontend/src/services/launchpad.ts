import { api } from "./api";

export type LaunchpadApp = {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  section: "launchpad" | "legados";
  tipo_acesso: "interno" | "externo";
  rota_interna: string;
  url_externa: string;
  badge: string;
  icon: string;
  abrir_em_nova_aba: boolean;
};

type LaunchpadResponse = {
  section: "launchpad" | "legados";
  count: number;
  results: LaunchpadApp[];
};

export async function fetchLaunchpadApps(section: "launchpad" | "legados" = "launchpad"): Promise<LaunchpadApp[]> {
  const { data } = await api.get<LaunchpadResponse>("/usuarios/launchpad-apps/", {
    params: { section },
  });

  return data.results;
}

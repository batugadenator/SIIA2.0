import { api } from "./api";

const isDev = import.meta.env.DEV;
const localDevAsset = (fallbackPath: string, remoteUrl: string) => (isDev ? fallbackPath : remoteUrl);
const localDevLink = (fallbackPath: string, remoteUrl: string) => (isDev ? fallbackPath : remoteUrl);

export type CmsMenuItem = {
  id: number;
  titulo: string;
  link_url: string;
  icone_classe?: string;
  abrir_em_nova_aba: boolean;
  filhos: CmsMenuItem[];
};

export type CmsPublicMenuItem = {
  id: number;
  titulo: string;
  url: string;
  is_externo: boolean;
  icone_classe?: string;
  submenus: CmsPublicMenuItem[];
};

export type CmsArtigo = {
  id: number;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem_url: string;
  link_externo: string;
  destaque: boolean;
  publicado_em: string | null;
};

export type CmsNoticia = {
  id: number;
  titulo: string;
  imagem_url: string;
  categoria_texto: string;
  data_publicacao: string;
  conteudo: string;
  is_destaque: boolean;
};

export type CmsCard = {
  id: number;
  titulo: string;
  descricao: string;
  link_url: string;
  icone: string;
  icone_url: string;
  cor_fundo: string;
  cor_texto: string;
};

export type CmsConfiguracao = {
  nome_portal: string;
  logo_url: string;
  cor_primaria: string;
  cor_secundaria: string;
  nextcloud_publico: string;
  nextcloud_interno: string;
};

export type CmsCabecalhoLink = {
  titulo: string;
  url: string;
  abrir_em_nova_aba: boolean;
};

export type CmsCabecalhoPublico = {
  nome_instituicao: string;
  nome_orgao: string;
  slogan: string;
  logo_url: string;
  link_logo_url: string;
  links: CmsCabecalhoLink[];
};

export type CmsPublicPageData = {
  configuracao: CmsConfiguracao;
  cabecalho: CmsCabecalhoPublico;
  menus: CmsMenuItem[];
  artigos: CmsArtigo[];
  noticias: CmsNoticia[];
  cards: CmsCard[];
};

export type CmsNoticiasPageResponse = {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  next: boolean;
  previous: boolean;
  categoria_texto: string;
  q?: string;
  categorias_disponiveis: string[];
  results: CmsNoticia[];
};

const mockData: CmsPublicPageData = {
  configuracao: {
    nome_portal: "SIIA 2.0",
    logo_url: "",
    cor_primaria: "#1351B4",
    cor_secundaria: "#2670E8",
    nextcloud_publico: localDevLink("/", "https://nextcloud.exemplo.gov.br/publico"),
    nextcloud_interno: localDevLink("/dashboard", "https://nextcloud.exemplo.gov.br/interno"),
  },
  cabecalho: {
    nome_instituicao: "Ministerio da Defesa",
    nome_orgao: "Exercito Brasileiro",
    slogan: "Braco Forte - Mao Amiga",
    logo_url: "",
    link_logo_url: "/",
    links: [
      { titulo: "Inicio", url: "/", abrir_em_nova_aba: false },
      { titulo: "Servicos", url: "/servicos", abrir_em_nova_aba: false },
      { titulo: "Contato", url: "/contato", abrir_em_nova_aba: false },
      {
        titulo: "Estrutura Organizacional",
        url: "/estrutura-organizacional",
        abrir_em_nova_aba: false,
      },
    ],
  },
  menus: [
    { id: 1, titulo: "Inicio", link_url: "https://siia.gov.br", abrir_em_nova_aba: false, filhos: [] },
    {
      id: 2,
      titulo: "Servicos",
      link_url: "https://siia.gov.br/servicos",
      abrir_em_nova_aba: false,
      filhos: [
        {
          id: 21,
          titulo: "Diretorio Nextcloud",
          link_url: localDevLink("/", "https://nextcloud.exemplo.gov.br/publico"),
          abrir_em_nova_aba: true,
          filhos: [],
        },
      ],
    },
    { id: 3, titulo: "Contato", link_url: "https://siia.gov.br/contato", abrir_em_nova_aba: false, filhos: [] },
  ],
  artigos: [
    {
      id: 1,
      titulo: "Nova versao do portal SIIA",
      resumo: "Melhorias de navegacao e integracao entre modulos.",
      conteudo: "Conteudo resumido da noticia.",
      imagem_url: "",
      link_externo: "",
      destaque: true,
      publicado_em: "2026-04-11T10:00:00Z",
    },
    {
      id: 2,
      titulo: "SIAGG com novos paineis",
      resumo: "Indicadores e governanca com visual renovado.",
      conteudo: "Conteudo resumido da noticia.",
      imagem_url: "",
      link_externo: "",
      destaque: false,
      publicado_em: "2026-04-10T10:00:00Z",
    },
    {
      id: 3,
      titulo: "Reabilita amplia cobertura",
      resumo: "Novos fluxos para equipes de saude.",
      conteudo: "Conteudo resumido da noticia.",
      imagem_url: "",
      link_externo: "",
      destaque: false,
      publicado_em: "2026-04-09T10:00:00Z",
    },
  ],
  noticias: [
    {
      id: 1,
      titulo: "SIIA 2.0 integra paineis operacionais",
      imagem_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
      categoria_texto: "Operacionalidade",
      data_publicacao: "2026-04-11T10:00:00Z",
      conteudo: "Nova camada de observabilidade unifica indicadores estrategicos e operacionais.",
      is_destaque: true,
    },
    {
      id: 2,
      titulo: "AMAN publica nova diretriz de interoperabilidade",
      imagem_url: "https://images.unsplash.com/photo-1581091012184-5c2c6f8f5f6d?auto=format&fit=crop&w=1200&q=80",
      categoria_texto: "Institucional",
      data_publicacao: "2026-04-10T10:00:00Z",
      conteudo: "Documento atualiza requisitos de integracao entre modulos legados e novos servicos.",
      is_destaque: true,
    },
    {
      id: 3,
      titulo: "SIAGG recebe painel de governanca em tempo real",
      imagem_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
      categoria_texto: "Governanca",
      data_publicacao: "2026-04-09T10:00:00Z",
      conteudo: "Painel destaca evolucao de metas e riscos por eixo de gestao.",
      is_destaque: true,
    },
    {
      id: 4,
      titulo: "Reabilita amplia trilhas de cuidado",
      imagem_url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
      categoria_texto: "Saude",
      data_publicacao: "2026-04-08T10:00:00Z",
      conteudo: "Fluxos assistenciais reorganizados para acelerar o acompanhamento clinico.",
      is_destaque: true,
    },
    {
      id: 5,
      titulo: "Portal adota novo padrao DSGov para cards",
      imagem_url: "https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=1200&q=80",
      categoria_texto: "UX",
      data_publicacao: "2026-04-07T10:00:00Z",
      conteudo: "Atualizacao melhora leitura, contraste e hierarquia visual das secoes.",
      is_destaque: true,
    },
    {
      id: 6,
      titulo: "Diretorio Nextcloud ganha novo catalogo",
      imagem_url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1200&q=80",
      categoria_texto: "Documentacao",
      data_publicacao: "2026-04-06T10:00:00Z",
      conteudo: "Biblioteca documental reorganizada para busca rapida por unidade e assunto.",
      is_destaque: true,
    },
  ],
  cards: [
    {
      id: 1,
      titulo: "Diretorio de Documentos",
      descricao: "Acesse pastas de documentos no Nextcloud.",
      link_url: localDevLink("/", "https://nextcloud.exemplo.gov.br/publico"),
      icone: "folder",
      icone_url: localDevAsset("/assets/logo-aman.png", "https://nextcloud.exemplo.gov.br/publico/icons/noticiario.svg"),
      cor_fundo: "#E7F1FF",
      cor_texto: "#1351B4",
    },
    {
      id: 2,
      titulo: "Agenda Institucional",
      descricao: "Consulte eventos e comunicados oficiais.",
      link_url: "https://siia.gov.br/agenda",
      icone: "calendar",
      icone_url: localDevAsset("/assets/logo-aman.png", "https://nextcloud.exemplo.gov.br/publico/icons/agenda.svg"),
      cor_fundo: "#E6F6EC",
      cor_texto: "#168821",
    },
    {
      id: 3,
      titulo: "Central de Atendimento",
      descricao: "Canal rapido para suporte tecnico.",
      link_url: "https://siia.gov.br/atendimento",
      icone: "help",
      icone_url: localDevAsset("/assets/logo-aman.png", "https://nextcloud.exemplo.gov.br/publico/icons/atendimento.svg"),
      cor_fundo: "#FFF4E5",
      cor_texto: "#A05C00",
    },
  ],
};

export async function fetchPublicPageData(): Promise<CmsPublicPageData> {
  try {
    const { data } = await api.get<CmsPublicPageData>("/cms/public-page/");
    return data;
  } catch {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockData), 350);
    });
  }
}

export async function fetchPublicMenuItems(): Promise<CmsPublicMenuItem[]> {
  try {
    const { data } = await api.get<CmsPublicMenuItem[]>("/cms/menus/");
    return data;
  } catch {
    const mapMenu = (menu: CmsMenuItem): CmsPublicMenuItem => ({
      id: menu.id,
      titulo: menu.titulo,
      url: menu.link_url,
      is_externo: menu.abrir_em_nova_aba,
      icone_classe: menu.icone_classe,
      submenus: (menu.filhos || []).map(mapMenu),
    });

    const fallback = mockData.menus.map(mapMenu);

    return new Promise((resolve) => {
      setTimeout(() => resolve(fallback), 250);
    });
  }
}

export async function fetchPublicNoticiasPage(
  page = 1,
  pageSize = 12,
  categoriaTexto = "",
  query = ""
): Promise<CmsNoticiasPageResponse> {
  try {
    const params: Record<string, string | number> = {
      page,
      page_size: pageSize,
    };

    if (categoriaTexto) {
      params.categoria_texto = categoriaTexto;
    }
    if (query) {
      params.q = query;
    }

    const { data } = await api.get<CmsNoticiasPageResponse>("/cms/noticias/", { params });
    return data;
  } catch {
    const queryLower = query.trim().toLowerCase();
    const filtradasPorCategoria = categoriaTexto
      ? mockData.noticias.filter((item) => item.categoria_texto.toLowerCase() === categoriaTexto.toLowerCase())
      : mockData.noticias;
    const filtradas = queryLower
      ? filtradasPorCategoria.filter(
          (item) =>
            item.titulo.toLowerCase().includes(queryLower)
            || item.conteudo.toLowerCase().includes(queryLower)
            || item.categoria_texto.toLowerCase().includes(queryLower)
        )
      : filtradasPorCategoria;

    const inicio = (page - 1) * pageSize;
    const fim = inicio + pageSize;
    const pageItems = filtradas.slice(inicio, fim);
    const totalPages = Math.max(1, Math.ceil(filtradas.length / pageSize));
    const categorias = Array.from(new Set(mockData.noticias.map((item) => item.categoria_texto))).sort();

    return new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            count: filtradas.length,
            page,
            page_size: pageSize,
            total_pages: totalPages,
            next: page < totalPages,
            previous: page > 1,
            categoria_texto: categoriaTexto,
            q: query,
            categorias_disponiveis: categorias,
            results: pageItems,
          }),
        300,
      );
    });
  }
}

  /* ═══════════════════════════════════════════════════════
     Autenticado – módulo CMS
  ═══════════════════════════════════════════════════════ */

  export type PerfilCMS = "admin" | "homologador" | "publicador" | null;

  export type MePerfilCMS = {
    id: number;
    username: string;
    full_name: string;
    perfil_cms: PerfilCMS;
    pode_autorizar: boolean;
    is_admin_cms: boolean;
  };

  export type StatusNoticia = "rascunho" | "pendente" | "publicado";

  export type NoticiaWorkflow = CmsNoticia & {
    status: StatusNoticia;
    autor: number | null;
    autor_nome: string | null;
    homologado_por: number | null;
    homologado_por_nome: string | null;
    homologado_em: string | null;
  };

  export type NoticiaInput = {
    titulo: string;
    imagem_url?: string;
    categoria_texto?: string;
    conteudo?: string;
    is_destaque?: boolean;
  };

  export type MenuPortalAdmin = {
    id: number;
    titulo: string;
    link_url: string;
    icone_classe: string;
    parent: number | null;
    ordem: number;
    abrir_em_nova_aba: boolean;
    ativo: boolean;
    num_filhos?: number;
  };

  export type MenuInput = Omit<MenuPortalAdmin, "id" | "num_filhos">;

  export type ConfiguracaoVisual = {
    id: number;
    chave: string;
    valor_svg: string;
    descricao: string;
  };

  export type ConfiguracaoVisualInput = Omit<ConfiguracaoVisual, "id">;

  export type CabecalhoLinkExtraAdmin = {
    id?: number;
    titulo: string;
    link_url: string;
    ordem: number;
    abrir_em_nova_aba: boolean;
    ativo: boolean;
  };

  export type CabecalhoLinkFixoAdmin = {
    titulo: string;
    titulo_en?: string;
    url: string;
    abrir_em_nova_aba: boolean;
  };

  export type CabecalhoFixosAdmin = {
    inicio: CabecalhoLinkFixoAdmin;
    servicos: CabecalhoLinkFixoAdmin;
    contato: CabecalhoLinkFixoAdmin;
    estrutura: CabecalhoLinkFixoAdmin;
  };

  export type CabecalhoWorkflowPayload = {
    nome_instituicao: string;
    nome_instituicao_en?: string;
    nome_orgao: string;
    nome_orgao_en?: string;
    slogan: string;
    slogan_en?: string;
    logo_url: string;
    link_logo_url: string;
    idioma_padrao: "pt-br" | "en";
    links_fixos: CabecalhoFixosAdmin;
    links_extras: CabecalhoLinkExtraAdmin[];
  };

  export type CabecalhoAdminState = {
    id: number;
    publicado: CabecalhoWorkflowPayload;
    rascunho: CabecalhoWorkflowPayload;
    status: "rascunho" | "pendente" | "publicado";
    submetido_em?: string | null;
    homologado_em?: string | null;
    autor?: number | null;
    homologado_por?: number | null;
  };

  export type CabecalhoAdminInput = CabecalhoWorkflowPayload;

  export type CabecalhoLinkExtraInput = CabecalhoLinkExtraAdmin;

  export type CabecalhoHistoricoItem = {
    id: number;
    acao: string;
    actor: number | null;
    actor_nome: string | null;
    criado_em: string;
    diff_text: string;
  };

  export type FontAwesomeIconOption = {
    id: number;
    style: "fas" | "fab";
    icon_name: string;
    class_name: string;
    label: string;
    version: string;
  };

  /* ── Perfil CMS ── */
  export async function fetchMePerfilCMS(): Promise<MePerfilCMS> {
    const { data } = await api.get("/cms/cms/me/");
    return data;
  }

  /* ── Notícias workflow ── */
  export async function fetchNoticiasWorkflow(status?: StatusNoticia): Promise<NoticiaWorkflow[]> {
    const params = status ? { status } : {};
    const { data } = await api.get("/cms/cms/noticias/", { params });
    return data;
  }

  export async function fetchNoticiaWorkflow(id: number): Promise<NoticiaWorkflow> {
    const { data } = await api.get(`/cms/cms/noticias/${id}/`);
    return data;
  }

  export async function criarNoticia(input: NoticiaInput): Promise<NoticiaWorkflow> {
    const { data } = await api.post("/cms/cms/noticias/", input);
    return data;
  }

  export async function editarNoticia(id: number, input: Partial<NoticiaInput>): Promise<NoticiaWorkflow> {
    const { data } = await api.put(`/cms/cms/noticias/${id}/`, input);
    return data;
  }

  export async function deletarNoticia(id: number): Promise<void> {
    await api.delete(`/cms/cms/noticias/${id}/`);
  }

  export async function submeterNoticia(id: number): Promise<NoticiaWorkflow> {
    const { data } = await api.post(`/cms/cms/noticias/${id}/submeter/`);
    return data;
  }

  export async function autorizarNoticia(id: number): Promise<NoticiaWorkflow> {
    const { data } = await api.post(`/cms/cms/noticias/${id}/autorizar/`);
    return data;
  }

  /* ── Menus Admin ── */
  export async function fetchMenusAdmin(): Promise<MenuPortalAdmin[]> {
    const { data } = await api.get("/cms/cms/admin/menus/");
    return data;
  }

  export async function criarMenu(input: MenuInput): Promise<MenuPortalAdmin> {
    const { data } = await api.post("/cms/cms/admin/menus/", input);
    return data;
  }

  export async function editarMenu(id: number, input: Partial<MenuInput>): Promise<MenuPortalAdmin> {
    const { data } = await api.put(`/cms/cms/admin/menus/${id}/`, input);
    return data;
  }

  export async function deletarMenu(id: number): Promise<void> {
    await api.delete(`/cms/cms/admin/menus/${id}/`);
  }

  export async function fetchFontAwesomeIcons(params?: {
    style?: "fas" | "fab";
    q?: string;
    limit?: number;
  }): Promise<FontAwesomeIconOption[]> {
    const { data } = await api.get("/cms/cms/admin/fontawesome-icons/", { params });
    return data;
  }

  /* ── Configurações Visuais SVG (admin) ── */
  export async function fetchConfigsVisuais(): Promise<ConfiguracaoVisual[]> {
    const { data } = await api.get("/cms/cms/admin/config-visual/");
    return data;
  }

  export async function criarConfigVisual(input: ConfiguracaoVisualInput): Promise<ConfiguracaoVisual> {
    const { data } = await api.post("/cms/cms/admin/config-visual/", input);
    return data;
  }

  export async function editarConfigVisual(
    id: number,
    input: Partial<ConfiguracaoVisualInput>
  ): Promise<ConfiguracaoVisual> {
    const { data } = await api.put(`/cms/cms/admin/config-visual/${id}/`, input);
    return data;
  }

  export async function deletarConfigVisual(id: number): Promise<void> {
    await api.delete(`/cms/cms/admin/config-visual/${id}/`);
  }

  /* ── Cabeçalho Público (admin) ── */
  export async function fetchCabecalhoAdmin(): Promise<CabecalhoAdminState> {
    const { data } = await api.get("/cms/cms/admin/cabecalho/");
    return data;
  }

  export async function salvarCabecalhoAdmin(input: CabecalhoAdminInput): Promise<{
    status: "rascunho" | "pendente" | "publicado";
    rascunho: CabecalhoWorkflowPayload;
    warnings?: string[];
  }> {
    const { data } = await api.put("/cms/cms/admin/cabecalho/", input);
    return data;
  }

  export async function submeterCabecalhoAdmin(): Promise<{ status: string; submetido_em?: string }> {
    const { data } = await api.post("/cms/cms/admin/cabecalho/submeter/");
    return data;
  }

  export async function autorizarCabecalhoAdmin(): Promise<{ status: string; homologado_em?: string }> {
    const { data } = await api.post("/cms/cms/admin/cabecalho/autorizar/");
    return data;
  }

  export async function fetchCabecalhoHistorico(): Promise<CabecalhoHistoricoItem[]> {
    const { data } = await api.get("/cms/cms/admin/cabecalho/historico/");
    return data;
  }

  export async function criarCabecalhoLinkExtra(input: CabecalhoLinkExtraInput): Promise<CabecalhoLinkExtraAdmin> {
    const { data } = await api.post("/cms/cms/admin/cabecalho/links/", input);
    return data;
  }

  export async function editarCabecalhoLinkExtra(
    id: number,
    input: Partial<CabecalhoLinkExtraInput>
  ): Promise<CabecalhoLinkExtraAdmin> {
    const { data } = await api.put(`/cms/cms/admin/cabecalho/links/${id}/`, input);
    return data;
  }

  export async function deletarCabecalhoLinkExtra(id: number): Promise<void> {
    await api.delete(`/cms/cms/admin/cabecalho/links/${id}/`);
  }

  export async function uploadCmsImage(file: File): Promise<{ url: string; name: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/cms/cms/admin/upload-image/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

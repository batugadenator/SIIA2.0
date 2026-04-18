Este **Plano de Desenvolvimento do Sistema CadFuncional** foi estruturado com base nas diretrizes do Projeto Cadete Funcional, integrando as missões da equipe multidisciplinar com as regras de negócio e requisitos técnicos estabelecidos.

# Plano de Desenvolvimento do Sistema CadFuncional

## 1\. Visão Geral e Objetivos

O objetivo central é mitigar as fragilidades físicas dos cadetes da AMAN, reduzindo lesões preveníveis (atualmente 65% das lesões sem retorno) e oferecendo uma reabilitação multidisciplinar assertiva 1, 2\. O sistema focará especialmente no monitoramento da **S-RED** (Síndrome da Deficiência Energética Relativa) 3\.

## 2\. Arquitetura do Sistema

A aplicação será dividida em duas frentes principais, seguindo o padrão de separação entre cliente e servidor:

### 2.1. cadfuncional-backend (Django)

* **Linguagem:** Python (.py).  
* **Responsabilidades:** Gestão de banco de dados, autenticação de usuários, lógica de negócio (gatilhos e protocolos) e fornecimento de API para o frontend.  
* **Configurações:** Uso de YAML/JSON para variáveis de ambiente e definições de sistema.

### 2.2. cadfuncional-frontend (Web)

* **Linguagem:** TypeScript/TSX (.ts/.tsx), HTML e CSS/SCSS.  
* **Responsividade:** Design obrigatório para tablets e celulares, garantindo que instrutores e médicos possam registrar dados em campo Histórico.  
* **Design System:** Localizado em cadfuncional\\cadfuncional-frontend\\src\\design-system, será a única fonte de verdade para a interface (UI/UX).

## 3\. Modelagem de Dados (PostgreSQL)

O banco de dados será construído a partir das referências documentais e arquivos .csv localizados em cadfuncional\\cadfuncional-backend\\dados.

### 3.1. Esquema pessoal

* Gestão de militares (Cadetes e Instrutores) e perfis de profissionais de saúde.

### 3.2. Esquema saude

* **Tabelas de Referência:** Importação total do **CID-10** (Capítulos, Grupos, Categorias e Subcategorias) 4-7 e **CID-O** (Morfologias oncológicas) 8, 9\.  
* **Arquivo SAC:** Estrutura obrigatória para o Médico registrar a natureza da lesão (Óssea, Articular, Muscular, Tendinosa, Neurológica), região anatômica e **Lateralidade** (Direita, Esquerda, Bilateral) 10\.  
* **Atendimento:** Tabela fato que vincula o diagnóstico do Médico ao acompanhamento dos demais profissionais.

## 4\. Módulos e Funcionalidades por Perfil

### 4.1. Módulo Médico (Diagnóstico e Trava de Segurança)

* **Regra de Negócio:** O sistema impede o salvamento de atendimentos se o campo "Médico" não for informado, emitindo o alerta: **"Não esqueça de informar o Médico\!\!\!"** 11\.  
* **Diagnóstico Ortopédico:** Uso do Capítulo XIII (M00-M99) e Capítulo XIX (S00-T98) para traumatismos 1, Histórico.  
* **Gatilho S-RED:** Se selecionado "Lesão: Óssea" \+ "Origem: Por Estresse" (ou CID-10 M84.3), o sistema ativa automaticamente o protocolo multidisciplinar de S-RED 12, 13\. Nessa condição, no Campo 2 é exibido o campo **Decisão S-RED**, com seleção obrigatória entre **S-RED Positivo** e **S-RED Negativo**.
* **Campo 2 (Classificação da Lesão) orientado por catálogo:** os campos **Tipo**, **Origem da Lesão**, **Parte do Corpo**, **Parte Lesionada** e **Local da Lesão** devem ser preenchidos por seleção em cadeia a partir dos catálogos oficiais carregados no backend (`dados/cadfuncional`). Não deve haver preenchimento manual nesses campos de seleção. Quando não existir sublocalização específica para um item anatômico, o sistema utiliza a própria referência da estrutura como opção de local. Checkboxes permanecem como entradas de marcação múltipla.

### 4.2. Módulo de Reabilitação (Fisioterapia e Educador Físico)

* **Fisioterapeuta:** Registro de correção de assimetrias (pés planos/cavos, hiperlassidão) e tratamento de instabilidades 14\.  
* **Educador Físico:** Periodização do treino e prescrição de fortalecimento individualizado com base no campo **Lateralidade** do SAC 10, 14\.

### 4.3. Módulo Metabólico e Mental (Nutrição e Psicopedagogia)

* **Nutricionista:** Monitoramento de anemias nutricionais (D50-D53), desnutrição (E40-E46) e adequação calórico-proteica para reverter a perda de massa óssea 15-17.  
* **Psicopedagogo:** Monitoramento da **Bradipfrenia** (pensamento lentificado \- CID R41.8) e saúde mental vinculada a lesões graves 880, Histórico.

## 5\. Dashboards e Inteligência de Dados (Estatístico)

O sistema deve gerar visualizações automáticas via React/Vue:

* **Gráfico Evolutivo:** "Diagnóstico de S-RED x Ano" (Ex: comparando 2023, 2024 e 2025\) 18\.  
* **Eficácia da Reabilitação:** Percentual de "Lesões sem Retorno" classificadas como preveníveis 2\.  
* **Cobertura:** Relação entre total de cadetes (\~1.577) e atendimentos realizados 19\.

## 6\. Padronização e Manutenção

* **Documentação:** Toda a lógica de macros (anteriormente em VBA) e fluxos de dados deve ser documentada em Markdown (.md) 20\.  
* **Scripts de Carga:** Desenvolvimento de rotinas em Python para carregar e atualizar as tabelas CID e SAC a partir dos arquivos CSV originais.

## 7\. Fonte de Verdade e Rastreabilidade

* **Fonte de verdade técnica (backend):** `cadfuncional-backend/dados/modelagem_dados.md` define o contrato funcional de catálogo para o Campo 2 do Novo Atendimento (`tipo_lesao`, `origem_lesao`, `segmento_corporal`, `estrutura_anatomica`, `localizacao_lesao`).
* **Rastreabilidade de referência:** os catálogos de seleção são carregados a partir de `cadfuncional-backend/dados/cadfuncional/*.csv`, com priorização do modelo normalizado de referências no backend.
* **Consistência frontend-backend:** alterações na hierarquia de seleção clínica devem ser refletidas simultaneamente neste plano e no documento de modelagem do backend para evitar divergência de regra de negócio.

Este plano transforma o "rascunho incipiente" em uma plataforma robusta de **Saúde Militar**, garantindo que a AMAN possua dados confiáveis para a tomada de decisão estratégica sobre a prontidão física e intelectual de seu corpo de cadetes 20, 21\.  

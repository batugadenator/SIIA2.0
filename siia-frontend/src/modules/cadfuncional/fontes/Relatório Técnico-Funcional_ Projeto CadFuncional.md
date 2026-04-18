### Relatório Técnico-Funcional: Projeto Reabilita

##### 1\. Visão Geral e Justificativa do Projeto

O Projeto Reabilita tem como objetivo central oferecer um atendimento clínico-funcional especializado aos pacientes, visando restabelecer e otimizar suas condições físicas para o cumprimento das demandas da Saúde. A proposta fundamenta-se na estruturação de uma equipe multidisciplinar capaz de realizar diagnósticos precisos e intervenções precoces, focando na identificação das causas raízes das fragilidades físicas para aplicar protocolos de prevenção e reabilitação qualificada.A implementação deste projeto é justificada pelas seguintes fragilidades identificadas:

* Elevado volume de pacientes apresentando lesões ortopédicas e fragilidades físicas recorrentes.  
* Incapacidade temporária frequente para o desempenho de atividades devido a lesões evitáveis.  
* Ausência de um sistema estruturado para o registro, acompanhamento e histórico de lesões.  
* Dependência de registros manuais em planilhas sem mecanismos de verificação ou padronização.  
* Dificuldade técnica na recuperação de informações históricas para suporte à decisão clínica.  
* Análises estatísticas incipientes que impedem a gestão preditiva da saúde dos pacientes.

##### 2\. Diagnóstico da Situação Atual e Dados Estatísticos

A análise dos dados registrados até 13 de março de 2025 revela uma carga de trabalho significativa para a infraestrutura de TI, exigindo que o sistema suporte uma carga inicial mínima baseada em uma base de 1.577 pacientes. O volume agregado de ocorrências clínicas (atendimentos totais) demonstra a necessidade de escalabilidade.**Tabela 1: Resumo Geral de Atendimentos**| Variável | Quantidade | Percentual || \------ | \------ | \------ || Total de pacientes (Base de dados) | 1.577 | 100% || Pacientes Atendidos (Ocorrências únicas) | 293 | 19% || Retornos | 126 | 8% || **Total de Atendimentos (Volume de Processamento)** | **419** | \- |  
**Tabela 2: Tipologia das Lesões (N=293 Lesões sem Retorno)**| Categoria da Lesão | Quantidade | Percentual || \------ | \------ | \------ || Lesões Preveníveis | 189 | 65% || Lesões Decorrentes de Atividades | 62 | 21% || Lesões Cirúrgicas | 37 | 13% || Não Definidas | 5 | 2% |  
"O cenário atual é caracterizado pela fragilidade na integridade dos dados, com início de registros em planilhas sem processos de validação. A falta de padronização e o uso de ferramentas rudimentares impossibilitam análises estatísticas precisas e comprometem a recuperação de informações vitais para o plano terapêutico multidisciplinar."

##### 3\. Arquitetura de Dados e Estrutura do Sistema

O sistema operará sobre um banco de dados relacional PostgreSQL. A arquitetura privilegia a integridade referencial através de chaves estrangeiras (FK) e o uso de tipos ENUM para garantir a padronização dos catálogos. Índices devem ser aplicados nas colunas paciente\_id e data\_atendimento para otimização de consultas.

* **atendimento** : Tabela central de eventos. Colunas: id (SERIAL PK), paciente\_id (INT), data (TIMESTAMP), tipo (ENUM: 'Inicial', 'Retorno').  
* **atividade** : Contexto do incidente. Colunas: id (SERIAL PK), contexto (ENUM: 'Acadêmicas', 'Campo', 'Deslocamento', 'EDL', 'Equitação', 'Formatura', 'Inopinado', 'Manobrão', 'Marcha', 'NAVAMAER', 'Parque', 'Serviço', 'SIESP', 'TFM/TAF', 'Treino atleta', 'Pqdt'), modalidade\_tfm (VARCHAR), modalidade\_esportiva (VARCHAR).  
* **causa** : Classificação diagnóstica. Colunas: id (SERIAL PK), descricao (ENUM: 'Decorrente da Atividade', 'Preventiva').  
* **origem\_lesao** : Vetor biomecânico. Colunas: id (SERIAL PK), classificacao (ENUM: 'Estresse', 'Traumática').  
* **lesao\_registro** : Junção de dados clínicos. Colunas: id (SERIAL PK), atendimento\_id (INT FK), lateralidade (ENUM: 'Direita', 'Esquerda', 'Não é o caso'), categoria\_id (INT FK para catálogos de lesões).  
* **dispensa** : Desfecho administrativo. Colunas: id (SERIAL PK), status (ENUM: 'VCL', 'Alta', 'Risco Cirúrgico').  
* **encaminhamento** : Fluxo multidisciplinar. Colunas: id (SERIAL PK), destino (ENUM: 'Fisioterapeuta', 'Educador Físico', 'Nutricionista', 'Pedagogo', 'Médico').  
* **exames** : Solicitações diagnósticas. Colunas: id (SERIAL PK), imagem (ENUM: 'RX', 'USG', 'TC', 'RM', 'DEXA'), laboratorio (ENUM: 'Sangue', 'Urina', 'Fezes').  
* **medicamentoso** : Controle de prescrição. Colunas: id (SERIAL PK), prescrito (BOOLEAN).  
* **catálogos\_lesões** : Tabelas de referência para articular, muscular, ossea, tendinosa e neurologica.

##### 4\. Integração dos Catálogos de Lesões

O sistema deve disponibilizar a seleção exaustiva conforme os mapeamentos técnicos extraídos dos arquivos de origem.

###### *Lesões Articulares*

* **Membros Superiores:**  
* **Esternoclavicular:**  Luxação.  
* **Ombro:**  Luxação acromioclavicular, Contusão, Luxação glenoumeral, Instabilidade glenoumeral, Lesão SLAP, Discinesia escapulotorácica, Artrose acromioclavicular, Bursite, Tendinose manguito rotador.  
* **Cotovelo:**  Contusão, Luxação, Luxação rádio ulnar proximal, Lesão complexo ligamentar medial/lateral.  
* **Punho:**  Contusão, Luxação, Instabilidade rádio ulnar distal, Lesão ligamentar (Escafossemilunar, Semilunopiramidal, Radiocarpal), Luxação periescafossemilunar, Fratura-luxação transescafosemilunar.  
* **Mão:**  Contusão, Luxação (Carpo-1º ao 5º metacarpo).  
* **Dedos:**  Steiner (Polegar), Luxações (Metacarpofalangeana, Interfalangeana proximal/distal), Contusões para Polegar, Indicador, Médio, Anelar e Mínimo.  
* **Coluna:**  
* **Cervical:**  Contusão, Luxações (C1 a C7-T1), Hérnias de disco (C1 a C7-T1).  
* **Torácica:**  Contusão, Luxações (T1 a T12-L1), Hérnias de disco (T1 a T12-L1).  
* **Lombar:**  Contusão, Luxações (L1 a L5-S1), Hérnias de disco (L1 a L5-S1).  
* **Sacrococcígea:**  Contusão (Sacro/Cóccix), Luxação sacrococcígea.  
* **Bacia:**  Luxação sacroilíaca, Sacroileíte, Pubeíte, Isquiopúbica, Iliopúbica.  
* **Membros Inferiores:**  
* **Quadril:**  Contusão, Luxação, Lesão labrum, Impacto femoroacetabular, Bursite troncatérica.  
* **Joelho:**  Contusão, Luxação, Luxação de patela, Lesão ligamentar (Medial, Lateral, Cruzado Anterior/Posterior), Canto posterolateral, Ligamento femoropatelar medial, Lesão osteocondral, Instabilidade femoropatelar, Menisco (Medial/Lateral).  
* **Tornozelo:**  Contusão, Entorse, Luxação, Lesão complexo ligamentar (Lateral/Medial).  
* **Pé:**  Contusão, Luxação/Fratura-luxação de Lis-Franc, Luxação tarso-metatarso (1º ao 5º).  
* **Dedos (Hálux ao Quinto):**  Luxações metatarsofalangeanas, Interfalangeanas e Contusões.

###### *Lesões Musculares*

* **Grupos Superiores e Tronco:**  Ombro (Deltoide, Supra/Infraespinhal, Subescapular, Redondo menor), Braço (Contusão, Bíceps, Braquial, Tríceps), Antebraço (Flexores/Extensores), Cervical (Cervicalgia, Torcicolo), Caixa torácica (Peitoral, Trapézio, Dorsalgia, Musculatura dorsal).  
* **Core:**  Musculatura lombar, Lombalgia mecânica, Musculatura abdominal.  
* **Membros Inferiores:**  Quadril (Psoas, Glúteo mínimo/médio/máximo, Rotadores externos), Coxa (Contusão, Adutores, Sartório, Quadríceps, Isquiotibiais, Trato iliotibial), Perna (Contusão, Extensores, Fibulares, Sóleo, Gastrocnêmio, Tibial posterior, Flexores).

###### *Lesões Ósseas (Fraturas)*

* **Segmentos:**  Ombro (Clavícula, Úmero proximal, Escápula), Braço (Úmero diáfise), Cotovelo (Úmero distal, Cabeça rádio, Olécrano, Ulna proximal), Antebraço (Rádio/Ulna diáfise), Punho (Rádio/Ulna distal, Escafoide, Semilunar, Piramidal, Capitato, Hamato, Trapézio, Trapezoide, Pisiforme).  
* **Mão/Dedos:**  Metacarpos (1º ao 5º), Falanges (Proximal, Média, Distal) para todos os dedos.  
* **Eixo Axial:**  Vértebras C1-C7, T1-T12, L1-L5, S1-S5, Cóccix.  
* **Segmento Inferior:**  Bacia (Ilíaco, Ísquio, Púbico, Acetábulo), Coxa (Fêmur diáfise/proximal/distal), Perna (Tíbia diáfise/proximal/distal, Fíbula diáfise/distal, Estresse tibial medial), Tornozelo (Maléolo lateral/medial/posterior).  
* **Pé/Dedos:**  Calcâneo, Navicular, Cuboide, Cuneiformes (Medial/Intermédio/Lateral), Tálus, Metatarsos (1º ao 5º), Falanges (Proximal, Média, Distal) para todos os artelhos.

###### *Lesões Tendinosas (Tendinopatias)*

* **Topografias:**  Ombro (Bíceps, Deltoide, Supra/Infraespinhal, Subescapular, Redondo menor, Tríceps proximal), Cotovelo (Epicondilites), Punho (DeQuervain, Extensor/Flexor ulnar carpo, Extensores/Flexores dedos), Bacia (Reto abdominal, Adutores, Reto femoral, Isquiotibiais), Quadril (Psoas, Glúteo médio/máximo, Trato iliotibial proximal), Joelho (Pata de ganso, Quadríceps, Patelar, Trato iliotibial distal, Bíceps femoral, Isquiotibiais, Gastrocnêmio), Tornozelo (Extensores, Fibulares, Aquiles, Tibial posterior), Pé (Fascíite plantar, Fibular curto).

###### *Alterações Neurológicas*

* **Membros Superiores:**  Plexo braquial, Cervicobraquialgia, Neuropraxia (Torácico longo, Plexo braquial), Síndrome do desfiladeiro torácico, Síndrome do túnel radial, Síndrome do túnel cubital, Síndrome do túnel do carpo, Síndrome do canal de Guyon.  
* **Membros Inferiores:**  Plexo lombossacro, Lombociatalgia, Compressão nervo cutâneo femoral lateral, Compressão nervo fibular comum, Síndrome do túnel do tarso anterior.

##### 5\. Protocolo S-RED (Síndrome da Deficiência Energética Relativa)

O sistema deve automatizar o alerta de investigação metabólica com base na etiologia da lesão.**Regra de Negócio: Origem por Estresse \= Iniciar Investigação S-RED | Origem Traumática \= Não investigar.Processo de Identificação:**

* Monitoramento de perda de peso rápida e excessiva.  
* Rastreio de alterações menstruais (considerando mascaramento por anticoncepcionais).  
* Identificação de ajuste inadequado de aporte energético e excesso de treino (overtraining).**Alterações Fisiológicas e Hormonais:**  
* **Hormonais:**  Disfunção do eixo hipotálamo-hipófise-gonadal, alterações na tireoide, redução de insulina, aumento da resistência ao GH e elevação de cortisol.  
* **Sistêmicas:**  Riscos cardiovasculares, distúrbios gastrointestinais, imunodeficiência (infecções frequentes), anemia, osteoporose e fadiga crônica.**Consequências e Impacto Funcional:**  
* Queda na força e resistência muscular.  
* Lentificação do pensamento, déficit de concentração e traços depressivos.  
* Risco elevado de fraturas por estresse e recuperação de lesão limitada/prolongada.**Prevenção e Conduta:**  Balanceamento do consumo energético, periodização rigorosa, suplementação nutricional e suporte psicológico.

##### 6\. Equipe Multidisciplinar: Papéis e Missões

**Médico:**  Responsável pelo diagnóstico clínico, identificação de fatores de risco biomecânicos (pés planos/cavos, hiperlassidão ligamentar, sobrepeso) e definição do plano terapêutico inicial.**Fisioterapeuta:**  Atua na identificação de riscos biomecânicos, orientação de métodos preventivos e execução do tratamento das lesões.**Nutricionista:**  Realiza avaliação nutricional para identificar déficits de macro e micronutrientes, prescrevendo planos alimentares para adequação energética.**Educador Físico:**  Responsável pela periodização do treinamento, identificação de queda de desempenho e auxílio na recuperação através de fortalecimento e alongamento individualizado.**Psicopedagogo:**  Avalia causas de saúde mental relacionadas à piora de desempenho e acompanha pacientes em restrição prolongada ou com lesões graves.**Enfermagem:**  Responsável pela coordenação da avaliação, verificação da adesão ao plano multidisciplinar e controle dos dados estatísticos.**Estatístico:**  Define as necessidades de coleta, modelagem de dados e processamento de informações para geração de relatórios, tabelas e gráficos de suporte à decisão.**Instrutor:**  Atua na ponta identificando precocemente pacientes com lesões ou queda de rendimento e fiscaliza o cumprimento das orientações terapêuticas.**Profissional de TI:**  Desenvolvedor e mantenedor do ecossistema de software e hardware, traduzindo as necessidades da equipe em funcionalidades do sistema.

##### 7\. Fluxo Clínico: Exames, Tratamentos e Desfechos

A captura de dados deve ser obrigatória para os seguintes fluxos:

* **Identificação de Lateralidade:**  O sistema deve exigir a marcação (Direita, Esquerda ou N/A) para toda lesão registrada.  
* **Exames Complementares:**  
* **Imagem:**  RX, USG (Ultrassonografia), TC (Tomografia), RM (Ressonância Magnética) e DEXA (Densitometria).  
* **Laboratório:**  Coletas de Sangue, Urina e Fezes.  
* **Condutas de Tratamento:**  Conservador, Cirúrgico ou Aguardar Exame.  
* **Critérios de Saída (Dispensa):**  
* **Alta:**  Recuperação total.  
* **VCL:**  Visita Médica com restrições laborais.  
* **Risco Cirúrgico:**  Encaminhamento para intervenção invasiva.

##### 8\. Roadmap de Implementação e Próximos Passos

A implementação seguirá o cronograma técnico estabelecido pela Gestão de Projetos:

1. **Homologação da Regra de Negócio:**  Utilização imediata deste relatório como especificação técnica funcional para o desenvolvimento.  
2. **Design de Interface (UI/UX):**  Criação de layout focado em usabilidade clínica e agilidade de preenchimento para equipes de campo.  
3. **Migração e ETL:**  Extração, transformação e carga dos dados da planilha piloto projeto\_saude.xlsm para o ambiente PostgreSQL produtivo.  
4. **Lançamento da Landing Page:**  Centralização do acesso ao sistema e disponibilização de manuais de protocolo multidisciplinar.


# SIIA 2.0

Contexto do Projeto: > Estou modernizando o ecossistema SIIA (legado PHP) para um portal de micro-apps usando Django (backend) e React (frontend). O banco de dados é PostgreSQL e a autenticação será via LDAP.

Tarefa: > Crie a estrutura inicial da Página Pública do Portal e o Dashboard de Aplicativos.

Requisitos Técnicos:

Página Pública (CMS-driven):

Deve seguir rigorosamente o padrão DSGov (gov.br).

Componentes necessários: Cabeçalho (com botão "Entrar"), Menu de Navegação, Carrossel de Notícias, Seção de Cards para links rápidos e Rodapé.

Os dados desta página (textos, cores, logos, menus) devem vir de uma API do Django (App CMS).

Backend (App CMS):

Crie modelos Django para: Artigo (notícias), Menu (hierárquico), ConfiguracaoPortal (logo, cores, links de diretórios Nextcloud) e CardInformativo.

O campo de link dos menus/cards deve suportar URLs externas para pastas do Nextcloud.

Fluxo de Autenticação:

No cabeçalho, o botão "Entrar" deve redirecionar para /login.

Após o login (via LDAP), o usuário deve ser redirecionado para a Página de Aplicativos (Dashboard).

Página de Aplicativos (Autenticada):

Esta página não precisa seguir o DSGov padrão, mas deve usar a identidade visual do app Reabilita como base do sistema visual interno: sidebar lateral, hierarquia clara, paleta azul e mesma lógica de navegação usada nos módulos autenticados.

Deve exibir cards para os aplicativos: Reabilita, SIAGG, CMS e os módulos legados do SIIA.

Instruções de Geração:

Gere o modelo Django (models.py) para o CMS.

Gere o componente React principal da Landing Page usando Tailwind CSS (ou a biblioteca DSGov, se preferir) simulando o consumo da API.

Certifique-se de que o layout do Dashboard (pós-login) seja diferente do layout público.

Banco de dados:
localhost
DB_NAME: siia
DB_USER: SIIA_DEV
DB_PASSWORD: highlighter

Testes Backend (Linux, sem permissao CREATEDB no PostgreSQL):

No ambiente atual, o usuario SIIA_DEV pode criar tabelas no schema public, mas nao pode criar um novo banco (ex.: test_siia).
Para rodar testes automatizados sem depender de CREATEDB, use o settings de teste com SQLite em memoria.

Comando direto:
python manage.py test --settings=core.settings_test -v 2

Script utilitario Linux:
cd siia-backend
chmod +x ./run-tests.sh
./run-tests.sh

Linux (modulo especifico):
./run-tests.sh apps.usuarios.tests

Riscos e observações:

O Django ainda alerta que reabilita e siagg têm mudanças sem migration (não bloqueia o CMS e login, mas é pendência técnica para essas apps).
Para homologação, basta setar USE_LDAP_AUTH=true e preencher LDAP_SERVER_URI e LDAP_BIND_DN_TEMPLATE em ambiente.

Observação importante:

Na sua versão instalada de @govbr-ds/core, não existem dist/fonts e dist/webfonts; por isso a Rawline não veio pronta do pacote.
O pipeline local já está preparado. Quando você tiver os binários Rawline, basta colocar em fonts com os nomes esperados no rawline-local.css

Fundamentos visuais do portal:

Os fundamentos visuais devem sustentar uma linguagem única em todo o design system. A base é a identidade do Reabilita, com variações controladas para módulos internos e públicos. Isso inclui:

- cores em paleta azul para interface interna, com contraste forte e estados sem ambiguidade;
- tipografia objetiva, legível e consistente entre títulos, textos e metadados;
- iconografia funcional, aplicada apenas quando agrega leitura e orientação;
- espaçamento e grid regulares, mantendo ritmo visual previsível;
- movimentos sutis, sem excesso de animação;
- superfícies e separadores usados para organizar informação, não para decorar.

Detalhes importantes do roteiro DSGov:

Acessibilidade: o elemento menu-scrim é o fundo escuro exibido ao abrir o menu. Ele deve permanecer ativo para reforcar o comportamento modal e manter o foco de interacao do usuario.

Nextcloud: para links de diretorios Nextcloud cadastrados no CMS, configure abrir_em_nova_aba=True. Assim, o frontend renderiza link externo e abre fora da SPA em nova aba.

Icones: use classes da biblioteca FontAwesome 5 Free. No banco, salve apenas o nome da classe, por exemplo: fas fa-folder-open.

baseado em E:\WIKI\1. Projetos\110 SIIA_2.0\SIIA2.0\react-dsgov\src\components\Breadcrumb aplique o Breadcrumb em E:\WIKI\1. Projetos\110 SIIA_2.0\SIIA2.0\siia-frontend\src\layouts\PublicLayout.tsx

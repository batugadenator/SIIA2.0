# Sequencia de migracao por fase

Ordem recomendada:

1. `principal`
2. `cadfuncional`
3. `cms`

Cada fase tem tres scripts:

- `precheck.sql`: inventario e dependencia
- `migrate.sql`: corte controlado para o schema destino
- `rollback.sql`: reversao do corte

Regra operacional:

- `public` deve ficar apenas como camada temporaria de compatibilidade durante a transicao.
- `principal` concentra identidade, autenticao, permissao e catalogo de sistemas.
- `cadfuncional` concentra o dominio assistencial do Cadete Funcional.
- `cms` concentra o dominio de conteudo.

Padrao de nomenclatura do dominio assistencial:

- usar prefixo `cadfuncional_` em tabelas, indices, sequences e constraints.
- script utilitario para rename de prefixo legado: `cadfuncional/rename_reabilita_prefix_to_cadfuncional.sql`.

Excecao definitiva aprovada:

- manter `public.mov_dia` e `public.tb_tuning_teste` como tabelas tecnicas definitivas.

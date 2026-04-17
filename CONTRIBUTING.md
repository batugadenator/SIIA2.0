# Guia de Contribuicao

## Fluxo oficial de branches

Este repositorio adota `main` como branch principal de integracao.

Regras obrigatorias:
- Trabalhar as mudancas em branch de feature a partir de `main`.
- Abrir PR para `main` (nao commitar direto em `main` em desenvolvimento normal).
- Propagar para `master` somente em lote controlado, via PR/merge de sincronizacao.
- Evitar commits paralelos em `main` e `master` ao mesmo tempo.

## Ciclo recomendado

1. Atualizar base local:
   - `git checkout main`
   - `git pull origin main`
2. Criar branch de trabalho:
   - `git checkout -b feat/nome-curto`
3. Desenvolver, testar e commitar.
4. Abrir PR para `main` com checklist preenchido.
5. Apos aprovar e mergear em `main`, executar sincronizacao planejada para `master`.

## Sincronizacao main -> master

Use janela controlada para sincronizar:
- `git checkout master`
- `git pull origin master`
- `git merge main`
- `git push origin master`

Se houver historicos divergentes por contexto legado, usar estrategia documentada de sincronizacao por arvore em PR especifico.

## Protecoes recomendadas no GitHub

Configurar no repositorio remoto:
- Branch protection em `main` e `master`.
- Bloqueio de push direto nas duas branches.
- Merge permitido somente via PR aprovado.
- Exigir status checks minimos (backend check, testes SIAGG, build frontend).

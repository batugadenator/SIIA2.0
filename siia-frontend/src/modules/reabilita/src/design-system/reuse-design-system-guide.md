# Reuso do Design System do SRA em outra aplicação

Este guia descreve como reaproveitar **estilos, tokens e componentes de UI** do `sra-frontend` em outra aplicação com a mesma arquitetura (React + TypeScript + MUI).

## 1) O que já existe hoje (inventário)

### Núcleo de tema/tokens (reutilização direta)

- `src/themes/colors.module.scss` (design tokens de cor)
- `src/themes/palette.ts` (mapeamento de tokens para palette do MUI)
- `src/themes/typography.ts` (escala tipográfica)
- `src/themes/compStyleOverride.ts` (overrides globais dos componentes MUI)
- `src/themes/types.ts`
- `src/themes/index.ts` (função `theme()`)
- `src/themes/style.scss` (estilo global complementar)

### Estáticos de marca

- `src/assets/sra_logo.png`
- `src/assets/max_eb.png`

### Bootstrap de providers no app

- `src/App.tsx` usa `ThemeProvider`, `StyledEngineProvider`, `SnackbarProvider`, `LocalizationProvider`.

## 2) Dependências mínimas para levar o DS

No novo projeto, garanta as dependências abaixo (ou equivalentes de versão compatível):

```bash
npm i @mui/material @mui/icons-material @emotion/react @emotion/styled
npm i @mui/x-date-pickers date-fns notistack
npm i sass
```

> O tema usa `colors.module.scss` e exige suporte a SCSS modules.

## 3) Estratégia recomendada (em 2 fases)

## Fase A — Reuso rápido (copiar e integrar)

1. Copie a pasta `src/themes` para o novo projeto.
2. Copie os arquivos de marca em `src/assets` (se fizer sentido para o novo produto).
3. No `App.tsx` do novo projeto, aplique o mesmo empilhamento base:

```tsx
<StyledEngineProvider injectFirst>
  <ThemeProvider theme={themes()}>
    <SnackbarProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        {children}
      </LocalizationProvider>
    </SnackbarProvider>
  </ThemeProvider>
</StyledEngineProvider>
```

4. Importe `src/themes/style.scss` no ponto de entrada do app.

## Fase B — Reuso sustentável (pacote compartilhado)

Crie um pacote interno (ex.: `packages/design-system`) e mova para ele:

- `theme/` (palette, typography, overrides, types)
- `tokens/` (colors)
- `providers/` (AppThemeProvider, NotificationProvider, DateProvider)
- `components/base/` (somente componentes desacoplados de domínio)

Depois, publique em registry privado ou use workspace monorepo.

## 4) Componentes: o que está pronto vs o que precisa desacoplar

### Reutilizáveis quase diretos

- `src/components/useNotify.tsx` (depende de `notistack`, baixo acoplamento)

### Reutilização com refatoração leve/média

- `src/components/Avatar.tsx` (hoje depende do tipo `User` local)
- `src/components/GroupsSelect.tsx` (depende de `GroupType` e semântica de grupos)

### Fortemente acoplados ao domínio SRA

- `src/components/NavBar.tsx` (`useAuth`, `useConf`, rotas específicas)
- `src/components/SideBar.tsx` (menu por papel e rotas de negócio)
- `src/components/PrivateLayout.tsx` (logout/perfil/rotas e contextos SRA)
- `src/components/Users/table/*.tsx` (hooks de API, endpoint de usuários, campos específicos)
- `src/components/ActivityFilter.tsx` (hooks e tipos de domínio de atividades/grupos)

## 5) Regras para desacoplar componentes

Quando migrar um componente para o Design System compartilhado:

1. **Trocar contexto por props**: remova `useAuth`, `useConf` e injete dados por propriedades.
2. **Trocar navegação interna por callbacks**: em vez de `navigate(...)`, exponha `onClick`, `onSelect`, `onLogout`.
3. **Trocar tipo de domínio por tipo genérico**: ex.: `User` -> `AvatarIdentity` mínimo (`name`, `avatarUrl?`).
4. **Remover chamadas de API**: hooks de dados ficam no app consumidor, não no DS.
5. **Evitar strings fixas de negócio**: parametrizar labels e textos.

## 6) Estrutura alvo sugerida para o novo app

```txt
src/
  design-system/
    theme/
    tokens/
    providers/
    components/
      base/
```

## 7) Checklist de validação no novo projeto

- Tema aplicado globalmente (cores, tipografia e overrides conferindo)
- Snackbar funcionando (`useNotify`)
- Date pickers com locale `ptBR`
- Sem imports para `contexts/auth` ou `contexts/conf` dentro do DS compartilhado
- Sem dependência de rotas/URLs de negócio dentro do DS

## 8) Observação importante sobre backend

No `sra-backend` não há templates HTML/CSS/JS de UI para reaproveitar; os arquivos em `charts/templates` são templates **Helm/Kubernetes** (infra/deploy), não componentes visuais.

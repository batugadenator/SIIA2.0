# Design System (copiável)

Estrutura pronta para reutilização em outra aplicação React + TypeScript + MUI.

## Fundamentos visuais

O padrão visual do ecossistema SIIA deve ser consistente em toda a área logada e derivar da identidade do Reabilita, com a paleta azul como referência principal. A composição deve privilegiar contraste, hierarquia e legibilidade, sem depender de efeitos decorativos para sustentar a estrutura da interface.

Diretrizes essenciais:

- Cores: azul como cor-base, com variações para estados, foco, destaque e superfície.
- Tipografia: títulos curtos, peso forte e espaçamento controlado para leitura rápida.
- Iconografia: FontAwesome apenas quando o ícone acrescentar clareza funcional.
- Espaçamento: uso consistente de margens e respiros para separar blocos e evitar ruído visual.
- Grid e alinhamento: blocos previsíveis, com estrutura responsiva e estável em desktop e mobile.
- Movimento: animações discretas e funcionais, apenas quando ajudam na percepção de estado.
- Ilustração: uso pontual, sempre complementar ao conteúdo e nunca dominante.
- Superfícies: cartões, barras e menus devem reforçar a organização da informação, não competir com ela.

## Estrutura

```txt
src/design-system/
  components/
    base/
      BaseAvatar.tsx
      CopyableText.tsx
      EmptyState.tsx
      SectionCard.tsx
      index.ts
    index.ts
  hooks/
    useNotify.tsx
    index.ts
  providers/
    ThemeProvider.tsx
    NotificationProvider.tsx
    DesignSystemProvider.tsx
    index.ts
  styles/
    global.scss
    index.ts
  theme/
    componentOverrides.ts
    createTheme.ts
    palette.ts
    typography.ts
    types.ts
    index.ts
  tokens/
    colors.module.scss
    index.ts
  index.ts
```

## Dependências mínimas

```bash
npm i @mui/material @mui/icons-material @emotion/react @emotion/styled
npm i notistack sass
```

## Uso mínimo

```tsx
import { DesignSystemProvider } from './design-system';
import './design-system/styles';

export function AppRoot() {
  return (
    <DesignSystemProvider>
      <App />
    </DesignSystemProvider>
  );
}
```

## Uso avançado (providers separados)

```tsx
import { ThemeProvider, NotificationProvider } from './design-system';
import './design-system/styles';

export function AppRoot() {
  return (
    <ThemeProvider>
      <NotificationProvider maxSnack={5} autoHideDuration={4000}>
        <App />
      </NotificationProvider>
    </ThemeProvider>
  );
}
```

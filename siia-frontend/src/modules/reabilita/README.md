# Reabilita Frontend (bootstrap inicial)

Estrutura inicial criada para React + TypeScript integrada ao design system existente.

## Organização criada

- `src/types`: contratos TS alinhados ao serializer de `atendimentos`.
- `src/services`: cliente Axios e service de atendimentos.
- `src/hooks`: hooks com TanStack Query.
- `src/components/atendimento`: componentes de UI do domínio.
- `src/pages`: página inicial de atendimentos.
- `src/providers`: providers da aplicação (`DesignSystemProvider` + `QueryClientProvider`).
- `src/app`: composição da aplicação.

## Fluxo atual

`types` → `services` → `hooks` → `pages/components`

## Próximos passos sugeridos

1. Instalar dependências:
   - `npm install`
2. Executar ambiente local:
   - `npm run dev`
3. Instalar dependências mínimas:
   - `react`, `react-dom`, `axios`, `@tanstack/react-query`
   - dependências do design system descritas em `src/design-system/README.md`
4. Configurar `VITE_API_BASE_URL` para apontar ao backend.
5. Evoluir formulário de registro de atendimento com validações de domínio.

## Configuração local (frontend + backend protegido)

Para desenvolvimento local com backend em `localhost:8000` e endpoints protegidos, crie
`reabilita-frontend/.env.development.local` com:

```env
VITE_API_BASE_URL=/api/v1
VITE_PROXY_TARGET=http://localhost:8000
VITE_API_BASIC_AUTH_HEADER=Basic <base64_de_usuario:senha>
```

Exemplo de geração do valor base64 no PowerShell:

```powershell
[Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes('usuario:senha'))
```

Com essa configuração, o Vite proxy injeta autenticação no tráfego `/api` em dev, evitando
bloqueios de preflight/CORS no navegador.

## Observação

A base já inclui runtime Vite + TypeScript; testes automatizados ainda não foram configurados.

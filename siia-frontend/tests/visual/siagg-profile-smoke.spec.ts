import { expect, test, type Page, type Route } from "@playwright/test";

type Profile = "admin" | "operador" | "consultor";

const AREAS = [
  {
    id: 1,
    nome: "Planejamento Estrategico",
    slug: "planejamento-estrategico",
    descricao: "Area de planejamento.",
    ativo: true,
    criado_em: "2026-04-16T10:00:00Z",
    atualizado_em: "2026-04-16T10:00:00Z",
  },
];

const DATA_ENTRIES = [
  {
    id: 1,
    area: 1,
    titulo: "Indicador de Conformidade",
    valor: "9800.50",
    data_referencia: "2026-04-10",
    observacao: "Base inicial",
    operador: 1,
    criado_em: "2026-04-16T10:00:00Z",
    atualizado_em: "2026-04-16T10:00:00Z",
  },
];

const REPORTS = [
  {
    id: 1,
    area: 1,
    titulo: "Relatorio Trimestral",
    descricao: "Resumo de entregas",
    data_referencia: "2026-04-10",
    autor: 1,
    criado_em: "2026-04-16T10:00:00Z",
    atualizado_em: "2026-04-16T10:00:00Z",
    arquivos: [],
  },
];

const GOVERNANCE_DOCS = [
  {
    id: 1,
    titulo: "Plano de Gestao",
    descricao: "Plano oficial",
    categoria: "Estrategico",
    arquivo: "http://localhost/media/plano.pdf",
    enviado_por: 1,
    criado_em: "2026-04-16T10:00:00Z",
  },
];

const PNCP_SUMMARY = {
  ano: 2026,
  cnpj: "00394452000103",
  total_itens: 2,
  valor_total: 3000,
  quantidade_categorias: 2,
  categorias: [
    { name: "material", quantity: 1, value: 1000 },
    { name: "servico", quantity: 1, value: 2000 },
  ],
  atualizado_em: "2026-04-16T10:00:00Z",
  fonte: "pncp",
};

const allowWrite = (profile: Profile) => profile === "admin" || profile === "operador";
const allowPncpRefresh = (profile: Profile) => profile === "admin";

async function fulfillJson(route: Route, statusCode: number, body: unknown) {
  await route.fulfill({
    status: statusCode,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function ensureAuthToken(page: Page, profile: Profile) {
  await page.addInitScript((profileName: Profile) => {
    window.localStorage.setItem("siia_token", `smoke-token-${profileName}`);
  }, profile);
}

async function installSiaggApiMocks(page: Page, profile: Profile) {
  await page.route("**/api/siagg/areas/**", (route) => fulfillJson(route, 200, AREAS));
  await page.route("**/api/siagg/data-entries/**", (route) => fulfillJson(route, 200, DATA_ENTRIES));

  await page.route("**/api/siagg/reports/*/arquivos/**", (route) => {
    if (route.request().method() === "POST") {
      if (!allowWrite(profile)) {
        return fulfillJson(route, 403, { detail: "forbidden" });
      }
      return fulfillJson(route, 201, {
        id: 9,
        report: 1,
        arquivo: "http://localhost/media/anexo.pdf",
        enviado_por: 1,
        criado_em: "2026-04-16T10:00:00Z",
      });
    }
    return fulfillJson(route, 200, []);
  });

  await page.route("**/api/siagg/reports/**", (route) => {
    const method = route.request().method();
    if (method === "GET") {
      return fulfillJson(route, 200, REPORTS);
    }
    if (method === "POST") {
      if (!allowWrite(profile)) {
        return fulfillJson(route, 403, { detail: "forbidden" });
      }
      return fulfillJson(route, 201, {
        ...REPORTS[0],
        id: 2,
        titulo: "Relatorio Criado no Smoke",
      });
    }
    return fulfillJson(route, 405, { detail: "method_not_allowed" });
  });

  await page.route("**/api/siagg/governance-documents/**", (route) => {
    const method = route.request().method();
    if (method === "GET") {
      return fulfillJson(route, 200, GOVERNANCE_DOCS);
    }
    if (method === "POST") {
      if (!allowWrite(profile)) {
        return fulfillJson(route, 403, { detail: "forbidden" });
      }
      return fulfillJson(route, 201, {
        ...GOVERNANCE_DOCS[0],
        id: 2,
        titulo: "Documento Smoke",
      });
    }
    return fulfillJson(route, 405, { detail: "method_not_allowed" });
  });

  await page.route("**/api/siagg/pncp/pca-summary/**", (route) => {
    const method = route.request().method();
    if (method === "GET") {
      return fulfillJson(route, 200, PNCP_SUMMARY);
    }
    if (method === "POST") {
      if (!allowPncpRefresh(profile)) {
        return fulfillJson(route, 403, { detail: "forbidden" });
      }
      return fulfillJson(route, 200, PNCP_SUMMARY);
    }
    return fulfillJson(route, 405, { detail: "method_not_allowed" });
  });
}

async function openReportsAndSubmit(page: Page) {
  await page.goto("/dashboard/siagg/relatorios");
  await page.waitForLoadState("domcontentloaded");
  const reportForm = page.locator(".siagg-panel", { hasText: "Novo relatorio" });
  await reportForm.getByLabel("Titulo").fill("Relatorio smoke");
  await reportForm.getByLabel("Data referencia").fill("2026-04-16");
  await reportForm.getByRole("button", { name: "Criar relatorio" }).click();
}

test.describe("Smoke SIAGG por perfil", () => {
  test("admin executa escrita em relatorios/governanca e refresh PNCP", async ({ page }) => {
    await ensureAuthToken(page, "admin");
    await installSiaggApiMocks(page, "admin");

    await openReportsAndSubmit(page);
    await expect(page.getByText("Falha ao criar relatorio", { exact: false })).toHaveCount(0);

    const uploadForm = page.locator(".siagg-panel", { hasText: "Upload de anexo PDF" });
    await uploadForm.getByLabel("Arquivo PDF").setInputFiles({
      name: "anexo.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%smoke"),
    });
    await uploadForm.getByRole("button", { name: "Enviar anexo" }).click();
    await expect(page.getByText("Falha ao enviar arquivo PDF", { exact: false })).toHaveCount(0);

    await page.goto("/dashboard/siagg/governanca");
    const govForm = page.locator(".siagg-panel", { hasText: "Enviar documento" });
    await govForm.getByLabel("Titulo").fill("Governanca smoke");
    await govForm.getByLabel("PDF").setInputFiles({
      name: "governanca.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%smoke"),
    });
    await govForm.getByRole("button", { name: "Enviar documento" }).click();
    await expect(page.getByText("Falha ao enviar documento", { exact: false })).toHaveCount(0);

    await page.goto("/dashboard/siagg/pncp");
    await page.getByRole("button", { name: "Forcar refresh" }).click();
    await expect(page.getByText("Nao foi possivel atualizar os dados do PNCP.")).toHaveCount(0);
  });

  test("operador consegue escrita de relatorios/governanca e recebe bloqueio no refresh PNCP", async ({ page }) => {
    await ensureAuthToken(page, "operador");
    await installSiaggApiMocks(page, "operador");

    await openReportsAndSubmit(page);
    await expect(page.getByText("Falha ao criar relatorio", { exact: false })).toHaveCount(0);

    await page.goto("/dashboard/siagg/governanca");
    const govForm = page.locator(".siagg-panel", { hasText: "Enviar documento" });
    await govForm.getByLabel("Titulo").fill("Governanca operador");
    await govForm.getByLabel("PDF").setInputFiles({
      name: "governanca-operador.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%smoke"),
    });
    await govForm.getByRole("button", { name: "Enviar documento" }).click();
    await expect(page.getByText("Falha ao enviar documento", { exact: false })).toHaveCount(0);

    await page.goto("/dashboard/siagg/pncp");
    await page.getByRole("button", { name: "Forcar refresh" }).click();
    await expect(page.getByText("Nao foi possivel atualizar os dados do PNCP.")).toBeVisible();
  });

  test("consultor recebe bloqueio de escrita e consegue leitura", async ({ page }) => {
    await ensureAuthToken(page, "consultor");
    await installSiaggApiMocks(page, "consultor");

    await page.goto("/dashboard/siagg");
    await expect(page.getByText("Areas monitoradas")).toBeVisible();

    await openReportsAndSubmit(page);
    await expect(page.getByText("Falha ao criar relatorio no endpoint /api/siagg/reports/.")).toBeVisible();

    const uploadForm = page.locator(".siagg-panel", { hasText: "Upload de anexo PDF" });
    await uploadForm.getByLabel("Arquivo PDF").setInputFiles({
      name: "anexo-consultor.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%smoke"),
    });
    await uploadForm.getByRole("button", { name: "Enviar anexo" }).click();
    await expect(page.getByText("Falha ao enviar arquivo PDF no endpoint /api/siagg/reports/{id}/arquivos/.")).toBeVisible();

    await page.goto("/dashboard/siagg/governanca");
    await expect(page.getByText("Documentos cadastrados")).toBeVisible();
    const govForm = page.locator(".siagg-panel", { hasText: "Enviar documento" });
    await govForm.getByLabel("Titulo").fill("Governanca consultor");
    await govForm.getByLabel("PDF").setInputFiles({
      name: "governanca-consultor.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n%smoke"),
    });
    await govForm.getByRole("button", { name: "Enviar documento" }).click();
    await expect(page.getByText("Falha ao enviar documento no endpoint /api/siagg/governance-documents/.")).toBeVisible();
  });
});

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

type Profile = "admin" | "operador" | "consultor";

type ProfileCreds = {
  username: string;
  password: string;
};

const credsByProfile: Record<Profile, ProfileCreds> = {
  admin: {
    username: process.env.SIAGG_SMOKE_ADMIN_USER || "siagg.smoke.admin",
    password: process.env.SIAGG_SMOKE_PASSWORD || "Smoke#12345",
  },
  operador: {
    username: process.env.SIAGG_SMOKE_OPERADOR_USER || "siagg.smoke.operador",
    password: process.env.SIAGG_SMOKE_PASSWORD || "Smoke#12345",
  },
  consultor: {
    username: process.env.SIAGG_SMOKE_CONSULTOR_USER || "siagg.smoke.consultor",
    password: process.env.SIAGG_SMOKE_PASSWORD || "Smoke#12345",
  },
};

async function loginWithApi(page: Page, request: APIRequestContext, profile: Profile) {
  const creds = credsByProfile[profile];
  const response = await request.post("/api/usuarios/login/", {
    data: {
      username: creds.username,
      password: creds.password,
    },
  });

  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  const token = body?.token as string | undefined;
  expect(Boolean(token)).toBeTruthy();

  await page.addInitScript((authToken: string) => {
    window.localStorage.setItem("siia_token", authToken);
  }, token!);

  await page.goto("/dashboard/siagg");
  await expect(page).toHaveURL(/\/dashboard\/siagg$/);

  return token!;
}

async function getFirstAreaId(request: APIRequestContext, token: string) {
  const areasResp = await request.get("/api/siagg/areas/", {
    headers: { Authorization: `Token ${token}` },
  });

  expect(areasResp.ok()).toBeTruthy();
  const areas = await areasResp.json();
  const areaId = areas?.[0]?.id as number | undefined;
  expect(Boolean(areaId)).toBeTruthy();
  return areaId!;
}

async function navigateAndAssertSiaggPages(page: Page) {
  await page.goto("/dashboard/siagg/relatorios");
  await expect(page.getByRole("heading", { name: "Relatorios", exact: true })).toBeVisible();

  await page.goto("/dashboard/siagg/governanca");
  await expect(page.getByRole("heading", { name: "Governanca", exact: true })).toBeVisible();

  await page.goto("/dashboard/siagg/pncp");
  await expect(page.getByRole("heading", { name: "PNCP", exact: true })).toBeVisible();
}

test.describe("Smoke integrado SIAGG por perfil", () => {
  test("admin com escrita em relatorios/governanca e refresh PNCP", async ({ page, request }) => {
    const token = await loginWithApi(page, request, "admin");
    const areaId = await getFirstAreaId(request, token);

    await expect(page.getByText("Filtro global de periodo")).toBeVisible();
    await navigateAndAssertSiaggPages(page);

    const pncpRefreshResp = await request.post("/api/siagg/pncp/pca-summary/", {
      headers: { Authorization: `Token ${token}` },
      data: { cnpj: "00394452000103", ano: 2026 },
    });
    expect([200, 503]).toContain(pncpRefreshResp.status());

    const reportCreateResp = await request.post("/api/siagg/reports/", {
      headers: { Authorization: `Token ${token}` },
      data: {
        area: areaId,
        titulo: "Relatorio smoke admin API",
        descricao: "validacao integrada",
        data_referencia: "2026-04-16",
      },
    });
    expect(reportCreateResp.status()).toBe(201);

    const governanceCreateResp = await request.post("/api/siagg/governance-documents/", {
      headers: { Authorization: `Token ${token}` },
      multipart: {
        titulo: `Governanca smoke admin API ${Date.now()}`,
        descricao: "validacao integrada",
        categoria: "Estrategico",
        arquivo: {
          name: "governanca-admin.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n%smoke"),
        },
      },
    });
    expect(governanceCreateResp.status()).toBe(201);

    await expect(page.getByRole("heading", { name: "PNCP", exact: true })).toBeVisible();
  });

  test("operador com escrita em relatorios/governanca e bloqueio de refresh PNCP", async ({ page, request }) => {
    const token = await loginWithApi(page, request, "operador");
    const areaId = await getFirstAreaId(request, token);

    await navigateAndAssertSiaggPages(page);

    const reportCreateResp = await request.post("/api/siagg/reports/", {
      headers: { Authorization: `Token ${token}` },
      data: {
        area: areaId,
        titulo: "Relatorio smoke operador API",
        descricao: "validacao integrada",
        data_referencia: "2026-04-16",
      },
    });
    expect(reportCreateResp.status()).toBe(201);

    const governanceCreateResp = await request.post("/api/siagg/governance-documents/", {
      headers: { Authorization: `Token ${token}` },
      multipart: {
        titulo: `Governanca smoke operador API ${Date.now()}`,
        descricao: "validacao integrada",
        categoria: "Estrategico",
        arquivo: {
          name: "governanca-operador.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n%smoke"),
        },
      },
    });
    expect(governanceCreateResp.status()).toBe(201);

    const pncpRefreshResp = await request.post("/api/siagg/pncp/pca-summary/", {
      headers: { Authorization: `Token ${token}` },
      data: { cnpj: "00394452000103", ano: 2026 },
    });
    expect(pncpRefreshResp.status()).toBe(403);

    await expect(page.getByRole("heading", { name: "PNCP", exact: true })).toBeVisible();
  });

  test("consultor com leitura e bloqueio de escrita", async ({ page, request }) => {
    const token = await loginWithApi(page, request, "consultor");
    const areaId = await getFirstAreaId(request, token);

    await expect(page.getByText("Areas monitoradas")).toBeVisible();
    await navigateAndAssertSiaggPages(page);

    const reportCreateResp = await request.post("/api/siagg/reports/", {
      headers: { Authorization: `Token ${token}` },
      data: {
        area: areaId,
        titulo: "Relatorio smoke consultor API",
        descricao: "deve bloquear",
        data_referencia: "2026-04-16",
      },
    });
    expect(reportCreateResp.status()).toBe(403);

    const governanceCreateResp = await request.post("/api/siagg/governance-documents/", {
      headers: { Authorization: `Token ${token}` },
      multipart: {
        titulo: "Governanca consultor API",
        descricao: "deve bloquear",
        categoria: "Estrategico",
        arquivo: {
          name: "governanca-consultor.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("%PDF-1.4\n%smoke"),
        },
      },
    });
    expect(governanceCreateResp.status()).toBe(403);

    const pncpRefreshResp = await request.post("/api/siagg/pncp/pca-summary/", {
      headers: { Authorization: `Token ${token}` },
      data: { cnpj: "00394452000103", ano: 2026 },
    });
    expect(pncpRefreshResp.status()).toBe(403);
  });
});

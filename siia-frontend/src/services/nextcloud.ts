import { api } from "./api";

export async function listNextcloudFiles(path = "/") {
  const { data } = await api.get("/cms/health/", { params: { path } });
  return data;
}

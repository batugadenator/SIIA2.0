import { api } from "./api";

export type AuthUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
};

export async function loginLDAP(username: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const { data } = await api.post("/usuarios/login/", { username, password });
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get("/usuarios/me/");
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/usuarios/logout/");
}

export function getStoredToken(): string {
  return localStorage.getItem("siia_token") ?? "";
}

export function storeToken(token: string): void {
  localStorage.setItem("siia_token", token);
}

export function clearToken(): void {
  localStorage.removeItem("siia_token");
}

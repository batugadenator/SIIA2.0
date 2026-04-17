import { apiClient } from './apiClient';
import type {
	AuthSession,
	ChangePasswordPayload,
	CreateSystemUserPayload,
	LoginPayload,
	LdapConfigStatus,
	LdapConfigUpdate,
	PasswordResetRequestPayload,
	SystemUserDetail,
	SystemUserResponse,
	UpdateUserPayload,
} from '../types/auth';

const RESOURCE_CSRF = '/auth/csrf/';
const RESOURCE_LOGIN = '/auth/login/';
const RESOURCE_ME = '/auth/me/';
const RESOURCE_LOGOUT = '/auth/logout/';
const RESOURCE_USERS = '/auth/usuarios/';
const RESOURCE_USERS_NEW = '/auth/usuarios/novo/';
const RESOURCE_CHANGE_PASSWORD = '/auth/mudar-senha/';
const RESOURCE_PASSWORD_RESET = '/auth/recuperar-senha/';
const RESOURCE_LDAP_CONFIG = '/auth/ldap-config/';

export const ensureCsrfToken = async (): Promise<void> => {
	await apiClient.get(RESOURCE_CSRF);
};

export const loginWithSession = async (payload: LoginPayload): Promise<AuthSession> => {
	const { data } = await apiClient.post<AuthSession>(RESOURCE_LOGIN, payload);
	return data;
};

export const meWithSession = async (): Promise<AuthSession> => {
	const { data } = await apiClient.get<AuthSession>(RESOURCE_ME);
	return data;
};

export const logoutWithSession = async (): Promise<void> => {
	await apiClient.post(RESOURCE_LOGOUT);
};

export const createSystemUser = async (
	payload: CreateSystemUserPayload,
): Promise<SystemUserResponse> => {
	const { data } = await apiClient.post<SystemUserResponse>(RESOURCE_USERS_NEW, payload);
	return data;
};

export const listSystemUsers = async (): Promise<SystemUserDetail[]> => {
	const { data } = await apiClient.get<SystemUserDetail[]>(RESOURCE_USERS);
	return data;
};

export const getSystemUserDetail = async (userId: number): Promise<SystemUserDetail> => {
	const { data } = await apiClient.get<SystemUserDetail>(`${RESOURCE_USERS}${userId}/`);
	return data;
};

export const updateSystemUser = async (
	userId: number,
	payload: UpdateUserPayload,
): Promise<SystemUserDetail> => {
	const { data } = await apiClient.patch<SystemUserDetail>(
		`${RESOURCE_USERS}${userId}/`,
		payload,
	);
	return data;
};

export const deleteSystemUser = async (userId: number): Promise<void> => {
	await apiClient.delete(`${RESOURCE_USERS}${userId}/`);
};

export const adminResetSystemUserPassword = async (userId: number): Promise<{ detail: string }> => {
	const { data } = await apiClient.post<{ detail: string }>(`${RESOURCE_USERS}${userId}/resetar-senha/`);
	return data;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<{ detail: string }> => {
	const { data } = await apiClient.post<{ detail: string }>(RESOURCE_CHANGE_PASSWORD, payload);
	return data;
};

export const requestPasswordReset = async (
	payload: PasswordResetRequestPayload,
): Promise<{ detail: string }> => {
	const { data } = await apiClient.post<{ detail: string }>(RESOURCE_PASSWORD_RESET, payload);
	return data;
};

export const getLdapConfigStatus = async (): Promise<LdapConfigStatus> => {
	const { data } = await apiClient.get<LdapConfigStatus>(RESOURCE_LDAP_CONFIG);
	return data;
};

export const updateLdapConfig = async (payload: LdapConfigUpdate): Promise<LdapConfigStatus> => {
	const { data } = await apiClient.put<LdapConfigStatus>(RESOURCE_LDAP_CONFIG, payload);
	return data;
};

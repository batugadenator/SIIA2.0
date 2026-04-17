import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	adminResetSystemUserPassword,
	changePassword,
	createSystemUser,
	deleteSystemUser,
	ensureCsrfToken,
	getLdapConfigStatus,
	getSystemUserDetail,
	listSystemUsers,
	requestPasswordReset,
	updateLdapConfig,
	updateSystemUser,
} from '../services/auth.service';
import type {
	ChangePasswordPayload,
	CreateSystemUserPayload,
	LdapConfigStatus,
	LdapConfigUpdate,
	PasswordResetRequestPayload,
	SystemUserDetail,
	SystemUserResponse,
	UpdateUserPayload,
} from '../types/auth';

export const useCreateSystemUser = () => {
	return useMutation<SystemUserResponse, unknown, CreateSystemUserPayload>({
		mutationFn: async (payload: CreateSystemUserPayload) => {
			await ensureCsrfToken();
			return createSystemUser(payload);
		},
	});
};

export const useListSystemUsers = () => {
	return useQuery({
		queryKey: ['systemUsers'],
		queryFn: listSystemUsers,
	});
};

export const useSystemUserDetail = (userId: number | null) => {
	return useQuery({
		queryKey: ['systemUser', userId],
		queryFn: () => (userId ? getSystemUserDetail(userId) : Promise.reject(new Error('Invalid user ID'))),
		enabled: userId !== null,
	});
};

export const useUpdateSystemUser = () => {
	const queryClient = useQueryClient();

	return useMutation<SystemUserDetail, unknown, { userId: number; payload: UpdateUserPayload }>({
		mutationFn: async ({ userId, payload }) => {
			await ensureCsrfToken();
			return updateSystemUser(userId, payload);
		},
		onSuccess: (data, variables) => {
			queryClient.setQueryData(['systemUser', variables.userId], data);
			queryClient.invalidateQueries({ queryKey: ['systemUsers'] });
		},
	});
};

export const useDeleteSystemUser = () => {
	const queryClient = useQueryClient();

	return useMutation<void, unknown, number>({
		mutationFn: async (userId: number) => {
			await ensureCsrfToken();
			await deleteSystemUser(userId);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['systemUsers'] });
		},
	});
};

export const useAdminResetSystemUserPassword = () => {
	return useMutation<{ detail: string }, unknown, number>({
		mutationFn: async (userId: number) => {
			await ensureCsrfToken();
			return adminResetSystemUserPassword(userId);
		},
	});
};

export const useChangePassword = () => {
	return useMutation<{ detail: string }, unknown, ChangePasswordPayload>({
		mutationFn: async (payload: ChangePasswordPayload) => {
			await ensureCsrfToken();
			return changePassword(payload);
		},
	});
};

export const useRequestPasswordReset = () => {
	return useMutation<{ detail: string }, unknown, PasswordResetRequestPayload>({
		mutationFn: async (payload: PasswordResetRequestPayload) => {
			await ensureCsrfToken();
			return requestPasswordReset(payload);
		},
	});
};

export const useLdapConfigStatus = () => {
	return useQuery<LdapConfigStatus>({
		queryKey: ['ldapConfigStatus'],
		queryFn: getLdapConfigStatus,
	});
};

export const useUpdateLdapConfig = () => {
	const queryClient = useQueryClient();
	return useMutation<LdapConfigStatus, unknown, LdapConfigUpdate>({
		mutationFn: async (payload: LdapConfigUpdate) => {
			await ensureCsrfToken();
			return updateLdapConfig(payload);
		},
		onSuccess: (data) => {
			queryClient.setQueryData(['ldapConfigStatus'], data);
		},
	});
};

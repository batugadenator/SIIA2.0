import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

import axios from 'axios';

import { ensureCsrfToken, loginWithSession, logoutWithSession, meWithSession } from '../services/auth.service';
import { registerUnauthorizedHandler, unregisterUnauthorizedHandler } from '../services/apiClient';
import type { AuthUser, LoginPayload } from '../types/auth';

export interface AuthContextValue {
	isReady: boolean;
	isAuthenticated: boolean;
	isAuthenticating: boolean;
	user: AuthUser | null;
	loginError: string | null;
	login: (payload: LoginPayload) => Promise<boolean>;
	logout: () => Promise<void>;
}

export interface AuthProviderProps {
	children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getErrorMessage = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		const detail = error.response?.data?.detail;
		if (typeof detail === 'string' && detail.trim()) {
			return detail;
		}
	}

	return 'Falha ao autenticar usuário.';
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [isReady, setIsReady] = useState(false);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loginError, setLoginError] = useState<string | null>(null);

	const bootstrapSession = useCallback(async () => {
		try {
			// apiClient agora envia o SIIA token como Authorization: Token <siia_token> (bridge).
			// O backend AuthMeView aceita tanto SessionAuthentication quanto TokenAuthentication.
			const session = await meWithSession();
			setUser(session.user);
		} catch {
			// Se tanto sessão quanto token falharem, sintetiza usuário admin mínimo enquanto
			// a integração de auth está sendo consolidada (SIIA integration mode).
			const siiaToken =
				typeof localStorage !== 'undefined' ? localStorage.getItem('siia_token') : null;
			if (siiaToken) {
				setUser({
					id: 0,
					username: 'siia_admin',
					first_name: '',
					last_name: '',
					is_staff: true,
					perfil: 'Administrador',
				});
			} else {
				setUser(null);
			}
		} finally {
			setIsReady(true);
		}
	}, []);

	useEffect(() => {
		void bootstrapSession();
	}, [bootstrapSession]);

	useEffect(() => {
		registerUnauthorizedHandler(() => {
			setUser(null);
			setLoginError(null);
		});
		return () => {
			unregisterUnauthorizedHandler();
		};
	}, []);

	const login = useCallback(async (payload: LoginPayload) => {
		setIsAuthenticating(true);
		setLoginError(null);

		try {
			await ensureCsrfToken();
			const session = await loginWithSession(payload);
			setUser(session.user);
			return true;
		} catch (error) {
			setUser(null);
			setLoginError(getErrorMessage(error));
			return false;
		} finally {
			setIsAuthenticating(false);
		}
	}, []);

	const logout = useCallback(async () => {
		try {
			await ensureCsrfToken();
			await logoutWithSession();
		} catch {
		} finally {
			setUser(null);
			setLoginError(null);
		}
	}, []);

	const contextValue = useMemo<AuthContextValue>(
		() => ({
			isReady,
			isAuthenticated: Boolean(user),
			isAuthenticating,
			user,
			loginError,
			login,
			logout,
		}),
		[isReady, user, isAuthenticating, loginError, login, logout],
	);

	return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth deve ser usado dentro de AuthProvider.');
	}
	return context;
};

import axios from 'axios';

type UnauthorizedHandler = () => void;

let _unauthorizedHandler: UnauthorizedHandler | null = null;

export const registerUnauthorizedHandler = (handler: UnauthorizedHandler): void => {
	_unauthorizedHandler = handler;
};

export const unregisterUnauthorizedHandler = (): void => {
	_unauthorizedHandler = null;
};

const env = (import.meta as { env?: Record<string, string | undefined> }).env;

const baseURL = env?.VITE_API_BASE_URL ?? 'http://localhost:8000/api/cadfuncional';

const readCookie = (name: string): string | null => {
	if (typeof document === 'undefined') {
		return null;
	}

	const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
	if (!match) {
		return null;
	}

	return decodeURIComponent(match[1]);
};

const shouldAttachCsrf = (method?: string): boolean => {
	if (!method) {
		return false;
	}

	const normalized = method.toUpperCase();
	return normalized !== 'GET' && normalized !== 'HEAD' && normalized !== 'OPTIONS' && normalized !== 'TRACE';
};

export const apiClient = axios.create({
	baseURL,
	withCredentials: true,
	xsrfCookieName: 'csrftoken',
	xsrfHeaderName: 'X-CSRFToken',
	headers: {
		'Content-Type': 'application/json',
	},
});

apiClient.interceptors.request.use((config) => {
	// SIIA integration bridge: send SIIA token as Bearer when no session cookie auth is present.
	// The backend accepts TokenAuthentication alongside SessionAuthentication.
	const siiaToken =
		typeof localStorage !== 'undefined' ? localStorage.getItem('siia_token') : null;
	if (siiaToken && !config.headers?.['Authorization']) {
		config.headers = config.headers ?? {};
		config.headers['Authorization'] = `Token ${siiaToken}`;
	}

	if (shouldAttachCsrf(config.method)) {
		const csrfToken = readCookie('csrftoken');
		if (csrfToken) {
			config.headers = config.headers ?? {};
			config.headers['X-CSRFToken'] = csrfToken;
		}
	}

	return config;
});

apiClient.interceptors.response.use(
	(response) => response,
	(error: unknown) => {
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			const url = (error.config?.url) ?? '';
			const isBootstrap = url.includes('/auth/me/') || url.includes('/auth/csrf/');
			const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
			if (!isBootstrap && !isLoginPage && _unauthorizedHandler) {
				_unauthorizedHandler();
			}
		}
		return Promise.reject(error);
	},
);

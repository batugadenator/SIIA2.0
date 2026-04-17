import { useEffect, useMemo } from 'react';

const hasWindow = () => typeof window !== 'undefined';

export const readPositiveIntParam = (
	params: URLSearchParams,
	key: string,
	fallback: number,
): number => {
	const raw = params.get(key);
	if (!raw) {
		return fallback;
	}

	const parsed = Number(raw);
	if (!Number.isInteger(parsed) || parsed < 1) {
		return fallback;
	}

	return parsed;
};

export const readEnumParam = <T extends string>(
	params: URLSearchParams,
	key: string,
	allowedValues: readonly T[],
	fallback: T | '',
): T | '' => {
	const raw = params.get(key);
	if (!raw) {
		return fallback;
	}

	return allowedValues.includes(raw as T) ? (raw as T) : fallback;
};

export const readStringParam = (
	params: URLSearchParams,
	key: string,
	fallback = '',
): string => {
	return params.get(key) ?? fallback;
};

export const readDateParam = (
	params: URLSearchParams,
	key: string,
	fallback = '',
): string => {
	const value = params.get(key) ?? '';
	const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
	return isValidDate ? value : fallback;
};

export const writeRequiredParam = (
	params: URLSearchParams,
	key: string,
	value: string,
): void => {
	params.set(key, value);
};

export const writeOptionalParam = (
	params: URLSearchParams,
	key: string,
	value: string | null | undefined,
): void => {
	if (value) {
		params.set(key, value);
		return;
	}

	params.delete(key);
};

export const writeOptionalTrimmedParam = (
	params: URLSearchParams,
	key: string,
	value: string | null | undefined,
): void => {
	const normalized = (value ?? '').trim();
	if (normalized) {
		params.set(key, normalized);
		return;
	}

	params.delete(key);
};

export const useInitialUrlQueryState = <TState>(
	readState: (params: URLSearchParams) => TState,
): TState => {
	return useMemo(() => {
		if (!hasWindow()) {
			return readState(new URLSearchParams());
		}

		return readState(new URLSearchParams(window.location.search));
	}, [readState]);
};

export const useSyncUrlQueryState = <TState>(
	writeState: (params: URLSearchParams, state: TState) => void,
	state: TState,
): void => {
	useEffect(() => {
		if (!hasWindow()) {
			return;
		}

		const params = new URLSearchParams(window.location.search);
		writeState(params, state);

		const query = params.toString();
		const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
		window.history.replaceState(null, '', nextUrl);
	}, [state, writeState]);
};

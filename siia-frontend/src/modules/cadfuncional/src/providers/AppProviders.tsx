import {
	createContext,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from 'react';

import { type PaletteMode } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createAppTheme, DesignSystemProvider } from '../design-system';
import { AuthProvider } from './AuthProvider';

const queryClient = new QueryClient();
const themeStorageKey = 'reabilita_theme_mode';

interface ThemeModeContextValue {
	mode: PaletteMode;
	toggleMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

const getInitialThemeMode = (): PaletteMode => {
	if (typeof window === 'undefined') {
		return 'light';
	}

	const persistedMode = window.localStorage.getItem(themeStorageKey);
	return persistedMode === 'dark' ? 'dark' : 'light';
};

export interface AppProvidersProps {
	children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
	const [mode, setMode] = useState<PaletteMode>(getInitialThemeMode);

	const toggleMode = () => {
		setMode((currentMode: PaletteMode) => {
			const nextMode: PaletteMode = currentMode === 'light' ? 'dark' : 'light';
			if (typeof window !== 'undefined') {
				window.localStorage.setItem(themeStorageKey, nextMode);
			}
			return nextMode;
		});
	};

	const theme = useMemo(() => {
		return createAppTheme(mode);
	}, [mode]);

	const contextValue = useMemo<ThemeModeContextValue>(
		() => ({
			mode,
			toggleMode,
		}),
		[mode],
	);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeModeContext.Provider value={contextValue}>
				<DesignSystemProvider theme={theme}>
					<AuthProvider>{children}</AuthProvider>
				</DesignSystemProvider>
			</ThemeModeContext.Provider>
		</QueryClientProvider>
	);
};

export const useThemeMode = (): ThemeModeContextValue => {
	const context = useContext(ThemeModeContext);
	if (!context) {
		throw new Error('useThemeMode deve ser usado dentro de AppProviders.');
	}

	return context;
};

import React from 'react';

import { CssBaseline } from '@mui/material';
import { StyledEngineProvider, Theme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

import { createAppTheme } from '../theme';

export interface ThemeProviderProps {
	children: React.ReactNode;
	theme?: Theme;
	injectFirst?: boolean;
	withCssBaseline?: boolean;
}

export const ThemeProvider = ({
	children,
	theme,
	injectFirst = true,
	withCssBaseline = true,
}: ThemeProviderProps) => {
	const resolvedTheme = React.useMemo(() => theme ?? createAppTheme(), [theme]);

	const content = (
		<MuiThemeProvider theme={resolvedTheme}>
			{withCssBaseline ? <CssBaseline /> : null}
			{children}
		</MuiThemeProvider>
	);

	if (!injectFirst) {
		return content;
	}

	return <StyledEngineProvider injectFirst>{content}</StyledEngineProvider>;
};

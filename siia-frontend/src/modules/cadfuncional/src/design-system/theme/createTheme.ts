import { type PaletteMode } from '@mui/material';
import { ThemeOptions, createTheme } from '@mui/material/styles';

import { colorTokens, type ColorTokens } from '../tokens';
import { createComponentOverrides } from './componentOverrides';
import { createPalette } from './palette';
import { createTypography } from './typography';
import type { ThemeOption } from './types';

export const buildThemeOption = (
	mode: PaletteMode = 'light',
	tokens: ColorTokens = colorTokens,
): ThemeOption => {
	if (mode === 'dark') {
		return {
			mode,
			colors: tokens,
			heading: tokens.darkTextTitle,
			paper: tokens.darkPaper,
			backgroundDefault: tokens.darkBackground,
			background: tokens.darkLevel1,
			darkTextPrimary: tokens.darkTextPrimary,
			darkTextSecondary: tokens.darkTextSecondary,
			textDark: tokens.darkTextTitle,
			menuSelected: tokens.secondaryLight,
			menuSelectedBack: tokens.darkLevel2,
			divider: tokens.darkLevel2,
		};
	}

	return {
		mode,
		colors: tokens,
		heading: tokens.grey900,
		paper: tokens.paper,
		backgroundDefault: tokens.grey50,
		background: tokens.primaryLight,
		darkTextPrimary: tokens.grey700,
		darkTextSecondary: tokens.grey500,
		textDark: tokens.grey900,
		menuSelected: tokens.secondaryDark,
		menuSelectedBack: tokens.secondaryLight,
		divider: tokens.grey200,
	};
};

export const createAppTheme = (
	mode: PaletteMode = 'light',
	tokens: ColorTokens = colorTokens,
) => {
	const themeOption = buildThemeOption(mode, tokens);

	const baseTheme = createTheme({
		direction: 'ltr',
		shape: {
			borderRadius: 8,
		},
		palette: createPalette(themeOption),
		typography: createTypography(themeOption),
		components: createComponentOverrides(themeOption),
		mixins: {
			toolbar: {
				minHeight: 48,
				padding: '16px',
				'@media (min-width: 600px)': {
					minHeight: 48,
				},
			},
		},
	} as ThemeOptions);

	return baseTheme;
};

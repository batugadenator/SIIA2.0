import type { PaletteOptions } from '@mui/material/styles';

import type { ThemeOption } from './types';

export const createPalette = (theme: ThemeOption): PaletteOptions => ({
	mode: theme.mode,
	common: {
		black: theme.colors.darkPaper,
	},
	primary: {
		light: theme.colors.primaryLight,
		main: theme.colors.primaryMain,
		dark: theme.colors.primaryDark,
		200: theme.colors.primary200,
		800: theme.colors.primary800,
	},
	secondary: {
		light: theme.colors.secondaryLight,
		main: theme.colors.secondaryMain,
		dark: theme.colors.secondaryDark,
		200: theme.colors.secondary200,
		800: theme.colors.secondary800,
	},
	error: {
		light: theme.colors.errorLight,
		main: theme.colors.errorMain,
		dark: theme.colors.errorDark,
	},
	warning: {
		light: theme.colors.warningLight,
		main: theme.colors.warningMain,
		dark: theme.colors.warningDark,
	},
	success: {
		light: theme.colors.successLight,
		200: theme.colors.success200,
		main: theme.colors.successMain,
		dark: theme.colors.successDark,
	},
	grey: {
		50: theme.colors.grey50,
		100: theme.colors.grey100,
		200: theme.colors.grey200,
		300: theme.colors.grey300,
		500: theme.darkTextSecondary,
		600: theme.heading,
		700: theme.darkTextPrimary,
		900: theme.textDark,
	},
	text: {
		primary: theme.darkTextPrimary,
		secondary: theme.darkTextSecondary,
		disabled: theme.colors.grey500,
	},
	background: {
		paper: theme.paper,
		default: theme.backgroundDefault,
	},
});

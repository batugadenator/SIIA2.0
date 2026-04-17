import type { TypographyOptions } from '@mui/material/styles/createTypography';

import type { ThemeOption } from './types';

export const createTypography = (theme: ThemeOption): TypographyOptions => ({
	fontFamily: 'Roboto, sans-serif',
	h1: {
		fontSize: '2.125rem',
		fontWeight: 700,
		color: theme.heading,
	},
	h2: {
		fontSize: '1.5rem',
		fontWeight: 700,
		color: theme.heading,
	},
	h3: {
		fontSize: '1.25rem',
		fontWeight: 600,
		color: theme.heading,
	},
	h4: {
		fontSize: '1rem',
		fontWeight: 600,
		color: theme.heading,
	},
	h5: {
		fontSize: '0.875rem',
		fontWeight: 500,
		color: theme.heading,
	},
	h6: {
		fontSize: '0.75rem',
		fontWeight: 500,
		color: theme.heading,
	},
	subtitle1: {
		fontSize: '0.875rem',
		fontWeight: 500,
		color: theme.textDark,
	},
	subtitle2: {
		fontSize: '0.75rem',
		fontWeight: 400,
		color: theme.darkTextSecondary,
	},
	body1: {
		fontSize: '0.875rem',
		fontWeight: 400,
		lineHeight: '1.334em',
	},
	body2: {
		fontSize: '0.875rem',
		fontWeight: 400,
		lineHeight: '1.5em',
		color: theme.darkTextPrimary,
	},
	caption: {
		fontSize: '0.75rem',
		fontWeight: 400,
		color: theme.darkTextSecondary,
	},
	button: {
		textTransform: 'capitalize',
		fontWeight: 500,
	},
});

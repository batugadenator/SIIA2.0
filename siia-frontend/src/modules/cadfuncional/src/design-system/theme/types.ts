import type { PaletteMode } from '@mui/material';
import type { ColorTokens } from '../tokens';

export type ThemeOption = {
	mode: PaletteMode;
	colors: ColorTokens;
	heading: string;
	paper: string;
	backgroundDefault: string;
	background: string;
	darkTextPrimary: string;
	darkTextSecondary: string;
	textDark: string;
	menuSelected: string;
	menuSelectedBack: string;
	divider: string;
};

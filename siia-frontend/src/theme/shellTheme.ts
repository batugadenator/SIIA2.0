import { createTheme, PaletteMode } from '@mui/material';

/**
 * Tema MUI do shell SIIA.
 * Compartilha os mesmos tokens visuais do módulo Reabilita (colors.module.scss)
 * sem depender do SCSS ou dos providers internos do submódulo.
 */

const light = {
  primary: { main: '#023b21', light: '#b1d1bf', contrastText: '#ffffff' },
  background: { default: '#f8fafc', paper: '#ffffff' },
  text: { primary: '#364152', secondary: '#697586' },
  divider: '#e3e8ef',
};

const dark = {
  primary: { main: '#b1d1bf', light: '#023b21', contrastText: '#012918' },
  background: { default: '#0d1b13', paper: '#122b1d' },
  text: { primary: '#e8f3ed', secondary: '#8fb5a0' },
  divider: '#1e3a2b',
};

export function createShellTheme(mode: PaletteMode = 'light') {
  const tokens = mode === 'dark' ? dark : light;

  return createTheme({
    palette: {
      mode,
      primary: tokens.primary,
      background: tokens.background,
      text: tokens.text,
      divider: tokens.divider,
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Rawline", "Raleway", "Inter", sans-serif',
    },
    components: {
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
            minHeight: 44,
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main + '18',
              color: theme.palette.primary.main,
              '& .MuiListItemIcon-root': { color: theme.palette.primary.main },
              '&:hover': { backgroundColor: theme.palette.primary.main + '28' },
            },
          }),
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { minWidth: 36 },
        },
      },
    },
  });
}

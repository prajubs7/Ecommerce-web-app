import { createTheme } from '@mui/material/styles';

// Custom palette — deliberately not MUI's default blue/purple.
// Deep teal as primary (trust, marketplace feel), warm amber as accent (CTAs, price highlights).
export const theme = createTheme({
  palette: {
    primary: {
      main: '#0F4C5C',
      light: '#3D7080',
      dark: '#0A363F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#E8924A',
      light: '#F0AC74',
      dark: '#C97530',
      contrastText: '#1A1A1A',
    },
    background: {
      default: '#FAF9F6',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#5C5C5C',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingInline: 18 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
  },
});

import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    primary: {
      main: '#2F6046',
      dark: '#204631',
      light: '#EAF1EC',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#A45B3E',
      dark: '#7E442D',
      light: '#F5E9E2',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F7F8F5',
      paper: '#ffffff',
    },
    text: {
      primary: '#252B27',
      secondary: '#606B64',
    },
    error: { main: '#A45B3E' },
    warning: { main: '#A45B3E', contrastText: '#ffffff' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgb(31 48 37 / 0.06)',
        },
      },
    },
  },
})

export default theme

import { createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    primary: { main: '#1f5f8b', dark: '#164666', light: '#e7f0f7', contrastText: '#ffffff' },
    secondary: { main: '#00897b' },
    success: { main: '#2e7d32', light: '#e8f5e9' },
    warning: { main: '#ed6c02', light: '#fff4e5' },
    error: { main: '#c62828', light: '#fdecea' },
    background: { default: '#f4f6f9', paper: '#ffffff' },
    text: { primary: '#1d2733', secondary: '#5b6878' },
    divider: '#dfe4ea',
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700, fontSize: '1.75rem' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiAppBar: {
      defaultProps: { elevation: 0 },
    },
    MuiPaper: {
      styleOverrides: {
        outlined: { borderColor: '#dfe4ea' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: '#f8fafc', color: '#3b4756' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
      },
    },
  },
})

export default theme

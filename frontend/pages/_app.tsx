import { ThemeProvider, createTheme } from '@mui/material';
import './globals.css';
import type { AppProps } from 'next/app';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000',
    },
    secondary: {
      main: '#fff'
    }
  }
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;

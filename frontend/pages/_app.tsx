import { ThemeProvider, createTheme } from '@mui/material';
import './globals.css';
import type { AppProps } from 'next/app';
import Footer from '../components/Footer';

const theme = createTheme({
  palette: {
    primary: {
      main: '#000',
    },
    secondary: {
      main: '#fff'
    },
  },
  typography: {
    fontFamily: 'Lato',
  },
});

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <ThemeProvider theme={theme}>
      <Component {...pageProps} />
      <Footer />
    </ThemeProvider>
  );
};

export default MyApp;

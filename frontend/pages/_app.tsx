import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import './globals.css';
import type { AppProps } from 'next/app';
import Footer from '../components/Footer';
import createEmotionCache from '../createEmotionCache';
import { CacheProvider, type EmotionCache } from '@emotion/react';
import Head from 'next/head';

const clientSideEmotionCache = createEmotionCache();

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

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}


const MyApp = ({ Component, emotionCache = clientSideEmotionCache, pageProps }: MyAppProps) => {
  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Component {...pageProps} />
        <Footer />
      </ThemeProvider>
    </CacheProvider>
  );
};

export default MyApp;

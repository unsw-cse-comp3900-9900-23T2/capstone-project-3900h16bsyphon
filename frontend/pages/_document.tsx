import { Html, Head, Main, NextScript } from 'next/document';
 
export default function Document() {
  return (
    <Html>
      <link rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Lato&display=optional" />
      <Head title="Syphon" >
        <meta name='description' content='A fountain of knowledge to syphon off for yourself 😎' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

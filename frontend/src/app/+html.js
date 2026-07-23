import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>Tidyups Cleaning</title>
        <meta name="description" content="Edmonton's trusted residential & commercial cleaning crew — quotes, services and contact in one app." />
        <meta name="theme-color" content="#0A0611" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="stylesheet" href="/leaflet.css" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Tidyups" />
        <ScrollViewStyleReset />
        <style>{'body{background-color:#0A0611}'}</style>
      </head>
      <body>
        {children}
        <script src="/register-sw.js" defer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Script from "next/script";
import { Preferences } from "../components/Preferences";
import Header from "../components/Header";
import "./legacy.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Show English | Aprenda Inglês Falando Inglês",
  description:
    "Show English - Aprenda inglês falando inglês. Aulas ao vivo, conversação, prática e acompanhamento.",
  icons: { icon: "/assets/new-logo-show-english.png" },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Montserrat:wght@600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Preferences>
          <Header />
          {children}
        </Preferences>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17833711571"
          strategy="afterInteractive"
        />
        <Script
          id="google-ads"
          strategy="afterInteractive"
        >{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','AW-17833711571');`}</Script>
      </body>
    </html>
  );
}

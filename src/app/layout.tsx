import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/client/context/AuthContext";
import Navbar from "@/client/components/Navbar";
import I18nProvider from "@/client/i18n/I18nProvider";
import Footer from "@/client/components/Footer";
import { AppGoogleOAuthProvider } from "@/client/providers/AppGoogleOAuthProvider";

export const metadata: Metadata = {
  title: "LSDLE - Jogo do LSD da UFCG",
  description: "Adivinhe a pessoa do dia do Laboratório de Sistemas Distribuídos (LSD) da UFCG baseado em suas informações e preferências! Cadastre-se para participar.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0c" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var theme=(t==='light'||t==='dark')?t:'dark';document.documentElement.dataset.theme=theme;var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',theme==='light'?'#fafafa':'#0a0a0c');}catch(e){document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
      </head>
      <body>
        <I18nProvider>
          <AppGoogleOAuthProvider>
            <AuthProvider>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Navbar />
                <main className="container fade-in" style={{ flex: 1, paddingBottom: '3rem', display: 'flex', flexDirection: 'column' }}>
                  {children}
                </main>
                <Footer />
              </div>
            </AuthProvider>
          </AppGoogleOAuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

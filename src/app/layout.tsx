import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/client/context/AuthContext";
import Navbar from "@/client/components/Navbar";
import I18nProvider from "@/client/i18n/I18nProvider";
import Footer from "@/client/components/Footer";
import { AppGoogleOAuthProvider } from "@/client/providers/AppGoogleOAuthProvider";
import ThemeBootstrap from "@/client/components/ThemeBootstrap";
import { THEME_BOOTSTRAP_SCRIPT, THEME_CRITICAL_CSS } from "@/shared/theme";

export const metadata: Metadata = {
  title: "O Show da Computação",
  description: "O Show da Computação: um quiz estilo Show do Milhão sobre computação. Responda perguntas do POSCOMP de dificuldade crescente, use suas ajudas e chegue ao milhão!",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" suppressHydrationWarning />
        <meta name="theme-color" content="#0a0a0c" suppressHydrationWarning />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOTSTRAP_SCRIPT,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: THEME_CRITICAL_CSS }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS_URL} />
      </head>
      <body suppressHydrationWarning>
        <ThemeBootstrap />
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

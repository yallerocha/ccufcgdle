import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AuthProvider } from "@/client/context/AuthContext";
import Navbar from "@/client/components/Navbar";
import I18nProvider from "@/client/i18n/I18nProvider";
import Footer from "@/client/components/Footer";
import { AppGoogleOAuthProvider } from "@/client/providers/AppGoogleOAuthProvider";
import ThemeBootstrap from "@/client/components/ThemeBootstrap";
import {
  isTheme,
  THEME_BG_COLORS,
  THEME_COOKIE,
  THEME_META_COLORS,
  themeColorScheme,
  THEME_BOOTSTRAP_SCRIPT,
  type Theme,
} from "@/shared/theme";

export const metadata: Metadata = {
  title: "LSDLE - Jogo do LSD da UFCG",
  description: "Adivinhe a pessoa do dia do Laboratório de Sistemas Distribuídos (LSD) da UFCG baseado em suas informações e preferências! Cadastre-se para participar.",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE)?.value;
  const theme: Theme = isTheme(cookieTheme) ? cookieTheme : 'dark';

  return (
    <html
      lang="pt-BR"
      data-theme={theme}
      suppressHydrationWarning
      style={{
        colorScheme: themeColorScheme(theme),
        backgroundColor: THEME_BG_COLORS[theme],
      }}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content={THEME_META_COLORS[theme]} />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_BOOTSTRAP_SCRIPT,
          }}
        />
      </head>
      <body style={{ backgroundColor: THEME_BG_COLORS[theme] }}>
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

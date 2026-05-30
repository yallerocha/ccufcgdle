import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/client/context/AuthContext";
import Navbar from "@/client/components/Navbar";
import I18nProvider from "@/client/i18n/I18nProvider";
import Footer from "@/client/components/Footer";

export const metadata: Metadata = {
  title: "LSDLE - Jogo do LSD da UFCG",
  description: "Adivinhe a pessoa do dia do Laboratório de Sistemas Distribuídos (LSD) da UFCG baseado em suas informações e preferências! Cadastre-se para participar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');document.documentElement.dataset.theme=(t==='light'||t==='dark')?t:'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();`,
          }}
        />
      </head>
      <body>
        <I18nProvider>
          <AuthProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main className="container fade-in" style={{ flex: 1, paddingBottom: '3rem', display: 'flex', flexDirection: 'column' }}>
                {children}
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}

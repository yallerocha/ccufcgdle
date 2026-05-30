import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/client/context/AuthContext";
import Navbar from "@/client/components/Navbar";

export const metadata: Metadata = {
  title: "UFCGdle - Jogo do Curso de Computação da UFCG",
  description: "Adivinhe o personagem do dia do curso de Computação da UFCG baseado em suas informações de curso e preferências! Registre-se para ser um dos personagens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <main className="container fade-in" style={{ flex: 1, paddingBottom: '3rem', display: 'flex', flexDirection: 'column' }}>
              {children}
            </main>
            <footer style={{
              textAlign: 'center',
              padding: '2rem 0',
              color: 'var(--text-dim)',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              backgroundColor: 'rgba(11, 13, 25, 0.4)',
              marginTop: 'auto'
            }}>
              <p>UFCGdle © 2026. Feito para o curso de Ciência da Computação - UFCG.</p>
            </footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

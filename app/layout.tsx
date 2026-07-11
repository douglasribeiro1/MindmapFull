import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'MindFlow Pro - Mapas Mentais para Estudos',
  description: 'Um aplicativo profissional de mapas mentais para estudos, offline-first, de alta performance e com recursos avançados.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

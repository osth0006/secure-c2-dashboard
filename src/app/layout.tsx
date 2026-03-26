import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Secure C2 Dashboard — Joint Operations Center',
  description: 'Real-time command and control dashboard for joint operations monitoring. A portfolio demonstration project.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-hidden">{children}</body>
    </html>
  );
}

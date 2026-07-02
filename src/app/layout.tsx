import type { Metadata, Viewport } from 'next';
import { Pacifico, Quicksand } from 'next/font/google';
import './globals.css';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pacifico',
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Brody — Personal Assistant',
  description: 'Ride the wave, man. Your personal AI assistant.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Brody',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1d20',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${pacifico.variable} ${quicksand.variable}`}>
      <body className="h-full">{children}</body>
    </html>
  );
}

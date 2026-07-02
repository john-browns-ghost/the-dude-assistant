import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Playfair_Display } from 'next/font/google';
import './globals.css';

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lebowski — Personal Assistant',
  description: 'The Dude abides. Your personal AI assistant, man.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'The Dude',
  },
};

export const viewport: Viewport = {
  themeColor: '#090604',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full ${bebas.variable} ${playfair.variable}`}>
      <body className="h-full">{children}</body>
    </html>
  );
}

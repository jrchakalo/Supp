import type {Metadata, Viewport} from 'next';
import { Fredoka } from 'next/font/google';
import './globals.css'; // Global styles

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' });

const siteUrl = 'https://www.supp.lol';
const siteDescription =
  'Supp is a classroom platform with D20 trivia, knockout competitions, live rooms with QR codes, bilingual PT/EN questions, light and dark themes and seasonal events such as Halloween.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Supp',
  title: {
    default: 'Supp — Classroom Games, Competition & Live',
    template: '%s | Supp',
  },
  description: siteDescription,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    siteName: 'Supp',
    title: 'Supp — Classroom Games, Competition & Live',
    description: siteDescription,
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Supp',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Supp — Classroom Games, Competition & Live',
    description: siteDescription,
    images: ['/opengraph-image.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#ffd166',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={fredoka.variable}>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}

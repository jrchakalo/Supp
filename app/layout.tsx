import type {Metadata, Viewport} from 'next';
import { Fredoka } from 'next/font/google';
import './globals.css'; // Global styles

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' });

export const metadata: Metadata = {
  title: 'Supp — Classroom Games, Competition & Live',
  description:
    'Supp is a classroom platform with D20 trivia, knockout competitions, live rooms with QR codes, bilingual PT/EN questions, light and dark themes and seasonal events such as Halloween.',
};

export const viewport: Viewport = {
  themeColor: '#0b0517',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body className="antialiased" suppressHydrationWarning>{children}</body>
    </html>
  );
}

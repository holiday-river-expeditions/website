import type { Metadata } from 'next';
import { Open_Sans, Oswald } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

// Oswald serves as the fallback for the brand typeface, ATF Alternate Gothic,
// which is loaded via the Adobe Fonts (Typekit) kit linked in <head> below.
const oswald = Oswald({
    weight: ['500', '700'],
    variable: '--font-oswald',
    display: 'swap',
    subsets: ['latin'],
});

const openSans = Open_Sans({
    variable: '--font-open-sans',
    display: 'swap',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: {
        default: 'Holiday River Expeditions',
        template: '%s | Holiday River Expeditions',
    },
    description:
        'Guided whitewater rafting and nature experiences in Colorado and Utah',
    icons: {
        icon: [
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
        ],
        apple: [
            {
                url: '/apple-touch-icon.png',
                sizes: '180x180',
                type: 'image/png',
            },
        ],
        other: [
            {
                rel: 'mask-icon',
                url: '/safari-pinned-tab.svg',
                color: '#D00A0B',
            },
        ],
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <head>
                <link
                    rel='stylesheet'
                    href='https://use.typekit.net/guz5fen.css'
                />
            </head>
            <body
                className={`${oswald.variable} ${openSans.variable} antialiased`}
            >
                <Header />
                <main className='min-h-screen'>{children}</main>
                <Footer />
            </body>
        </html>
    );
}

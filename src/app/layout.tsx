import type { Metadata } from 'next';
import { Open_Sans, Oswald } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

// TODO: Replace Oswald fallback with Adobe Fonts ATF Alternate Gothic Medium
// once the kit ID is available. The official brand typeface is
// "ATF Alternate Gothic Medium" (Adobe Fonts). Add a <link> to the kit in
// <head> below and the CSS variable --font-alt-gothic will be used.
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
                {/*
                    TODO: Replace with Adobe Fonts kit link for
                    ATF Alternate Gothic Medium once kit ID is available:
                    <link rel="stylesheet" href="https://use.typekit.net/XXXXXXX.css" />
                */}
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

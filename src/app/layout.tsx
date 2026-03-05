import type { Metadata } from 'next';
import { Open_Sans, Stardos_Stencil } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const stardos = Stardos_Stencil({
    weight: '700',
    variable: '--font-stardos',
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
                color: '#A30D11',
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
        <html lang="en">
            <body
                className={`${stardos.variable} ${openSans.variable} antialiased`}
            >
                <Header />
                <main className="min-h-screen">{children}</main>
                <Footer />
            </body>
        </html>
    );
}

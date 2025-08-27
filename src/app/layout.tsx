import type {Metadata, Viewport} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import {PipelineProvider} from '@/contexts/PipelineContext';
import LayoutContent from './LayoutContent';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
    title: 'SAP DevOps Studio - Enterprise CI/CD Platform',
    description: 'Build and manage your CI/CD pipelines with ease',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang='en' className='h-full'>
            <body
                className={`h-screen overflow-hidden antialiased selection:bg-primary-50 selection:text-primary-700 text-slate-800 ui-compact ${inter.className}`}
            >
                <PipelineProvider>
                    <LayoutContent>{children}</LayoutContent>
                </PipelineProvider>
            </body>
        </html>
    );
}

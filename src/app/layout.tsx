import type {Metadata, Viewport} from 'next';
import {Inter} from 'next/font/google';
import './globals.css';
import {PipelineProvider} from '@/contexts/PipelineContext';
import LayoutContent from './LayoutContent';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'Systiva - Enterprise CI/CD Platform',
    description: 'Build and manage your CI/CD pipelines with ease',
    keywords: 'CI/CD, DevOps, Pipeline, Automation, Enterprise',
    authors: [{name: 'Systiva Team'}],
    viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
    return (
        <html lang='en' className={`h-full ${inter.variable}`}>
            <head>
                {/* Cross-browser compatibility meta tags */}
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="format-detection" content="telephone=no" />
                <meta name="theme-color" content="#4f46e5" />
                <meta name="msapplication-TileColor" content="#4f46e5" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="apple-mobile-web-app-title" content="Systiva" />
                
                {/* Preload critical fonts */}
                <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
                
                {/* CSS for older browsers */}
                <style dangerouslySetInnerHTML={{
                    __html: `
                        /* Fallback for browsers that don't support CSS Grid */
                        @supports not (display: grid) {
                            .grid-fallback { display: flex; flex-wrap: wrap; }
                        }
                        
                        /* Fallback for browsers that don't support CSS Custom Properties */
                        @supports not (--custom: property) {
                            :root {
                                --primary-600: #4f46e5;
                                --primary-700: #4338ca;
                                --primary-800: #3730a3;
                                --primary-50: #eef2ff;
                                --primary-100: #e0e7ff;
                                --slate-900: #0f172a;
                                --slate-800: #1e293b;
                                --slate-700: #334155;
                                --slate-600: #475569;
                                --slate-500: #64748b;
                                --slate-400: #94a3b8;
                                --slate-300: #cbd5e1;
                                --slate-200: #e2e8f0;
                                --slate-100: #f1f5f9;
                                --slate-50: #f8fafc;
                            }
                        }
                    `
                }} />
            </head>
            <body
                className={`h-screen overflow-hidden antialiased selection:bg-primary-50 selection:text-primary-700 text-slate-800 ui-compact ${inter.className}`}
                style={{
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                }}
            >
                <PipelineProvider>
                    <LayoutContent>{children}</LayoutContent>
                </PipelineProvider>
            </body>
        </html>
    );
}

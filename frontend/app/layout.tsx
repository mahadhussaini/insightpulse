import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'InsightPulse - AI-Powered Customer Feedback',
  description: 'Transform customer feedback into actionable insights with AI-powered analysis, sentiment detection, and automated categorization.',
  keywords: 'customer feedback, AI analysis, sentiment analysis, feedback management, SaaS',
  authors: [{ name: 'InsightPulse Team' }],
  creator: 'InsightPulse',
  publisher: 'InsightPulse',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'InsightPulse - AI-Powered Customer Feedback',
    description: 'Transform customer feedback into actionable insights with AI-powered analysis.',
    url: 'http://localhost:3000',
    siteName: 'InsightPulse',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'InsightPulse - AI-Powered Customer Feedback',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InsightPulse - AI-Powered Customer Feedback',
    description: 'Transform customer feedback into actionable insights with AI-powered analysis.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-TileColor': '#3b82f6',
  },
};

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased h-full bg-gradient-to-br from-gray-50 via-white to-blue-50`}>
        {/* Animated background elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30"></div>
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <Providers>
          <div className="min-h-full relative">
            {/* Main content wrapper with enhanced styling */}
            <div className="relative z-10">
              {children}
            </div>
          </div>
          
          {/* Enhanced Toaster with better styling */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#1f2937',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(209, 213, 219, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                fontSize: '14px',
                fontWeight: '500',
                padding: '16px 20px',
                maxWidth: '400px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: '#065f46',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#991b1b',
                },
              },
              loading: {
                style: {
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  color: '#1e40af',
                },
              },
            }}
          />
        </Providers>

        {/* Performance monitoring script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Performance monitoring
              if (typeof window !== 'undefined') {
                window.addEventListener('load', function() {
                  setTimeout(function() {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    if (perfData && perfData.loadEventEnd - perfData.loadEventStart > 3000) {
                      console.warn('Page load time is slow:', perfData.loadEventEnd - perfData.loadEventStart + 'ms');
                    }
                  }, 0);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
} 
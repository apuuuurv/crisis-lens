import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Crisis Lens | Real-Time Incident Awareness',
  description:
    'Stay informed about nearby incidents with real-time risk signals, live alerts, and faster reporting through Crisis Lens.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster
            theme="dark"
            richColors
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(3, 7, 18, 0.96)',
                border: '1px solid rgba(34, 197, 94, 0.28)',
                color: 'rgba(244, 244, 245, 1)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 20px 60px -30px rgba(34, 197, 94, 0.55)',
              },
            }}
          />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}

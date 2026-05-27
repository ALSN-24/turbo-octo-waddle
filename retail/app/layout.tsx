/**
 * app/layout.tsx — Root layout (Server Component)
 *
 * Wraps the entire application. Mounted once — all pages share this shell.
 *
 * Responsibilities:
 *   - Sets HTML lang and font variables (Geist Sans + Geist Mono via next/font).
 *   - Wraps the app in ThemeProvider (next-themes) so the dark/light toggle
 *     works across all pages. suppressHydrationWarning is required on <html>
 *     because next-themes changes the class attribute after SSR.
 *   - Mounts the Sonner <Toaster> once at the root so toast() calls from any
 *     client component anywhere in the tree render correctly. The themed
 *     wrapper from components/ui/sonner.tsx reads the active theme and
 *     passes it to Sonner so toasts match the dark/light mode.
 */
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Retail CRM',
  description: 'Small Retail CRM - Customer, Inventory & Order Management',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png',  media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning prevents a console warning from next-themes,
    // which modifies the class attribute on <html> client-side after SSR.
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {/* Single Toaster instance shared by all client components.
              richColors uses semantic colours for success/error toasts.
              position="top-right" keeps it out of the way of content. */}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}

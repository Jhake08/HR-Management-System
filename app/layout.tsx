import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { NotificationProvider } from "@/components/notification-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PH HR System",
  description: "Complete HR management system for Philippine businesses",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="
            default-src 'self';
            script-src 'self' 'unsafe-eval' 'unsafe-inline';
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
            font-src 'self' data: https://fonts.gstatic.com;
            img-src 'self' data: blob: https:;
            connect-src 'self' https://sheets.googleapis.com https://accounts.google.com https://oauth2.googleapis.com;
            frame-src 'self' https://accounts.google.com;
          "
        />
      </head>
      <body className={inter.className}>
        <NotificationProvider>{children}</NotificationProvider>
      </body>
    </html>
  )
}

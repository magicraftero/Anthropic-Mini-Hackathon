import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Is It Raining On Me Right Now?',
  description: 'The most useless weather app ever created',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

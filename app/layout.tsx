import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IMPOSTER COLOR',
  description: 'IMPOSTER COLOR',
  generator: 'IMPOSTER COLOR',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

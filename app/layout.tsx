import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Sistema de Suporte - Dashboard",
  description: "Dashboard para gerenciamento de tickets de suporte",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans antialiased">
        {children}
      </body>
    </html>
  )
}

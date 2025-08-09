import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Suporte - Dashboard",
  description: "Sistema de acompanhamento e gerenciamento de tickets de suporte integrado com Supabase",
    generator: 'v0.dev'
}

export default function RootLayout({ children }: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

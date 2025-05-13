import type React from "react"
import type { Metadata } from "next"
import { AppProvider } from "@/context/app-context"
import ClientPage from "./ClientPage"

export const metadata: Metadata = {
  title: "étude - Note Taking App",
  description: "A beautiful and functional note taking application",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AppProvider>
      <ClientPage>{children}</ClientPage>
    </AppProvider>
  )
}


import './globals.css'
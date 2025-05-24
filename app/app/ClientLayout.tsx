"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      if (authChecked) return // Prevent multiple checks

      try {
        console.log("Checking authentication...")
        const res = await fetch("/api/user")

        if (!res.ok) {
          console.log("Auth check failed, status:", res.status)
          router.push("/sign-in")
        } else {
          console.log("Auth check successful")
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/sign-in")
      } finally {
        setAuthChecked(true)
      }
    }

    checkAuth()
  }, [router, authChecked])

  if (isLoading && authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8faf8]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#79B791] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#13262F]/70">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

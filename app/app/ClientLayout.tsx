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
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Auth kontrolü - sadece bir kez çalışsın
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        console.log("Checking authentication...")
        const res = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
        })

        if (isMounted) {
          if (res.ok) {
            console.log("Auth check successful")
            setIsAuthenticated(true)
            setIsLoading(false)
          } else {
            console.log("Auth check failed, redirecting to sign-in")
            setIsAuthenticated(false)
            setIsLoading(false)
            router.replace("/sign-in")
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
        if (isMounted) {
          setIsAuthenticated(false)
          setIsLoading(false)
          router.replace("/sign-in")
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8faf8]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#79B791] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#13262F]/70">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Router.replace çalışırken hiçbir şey gösterme
  }

  return <>{children}</>
}

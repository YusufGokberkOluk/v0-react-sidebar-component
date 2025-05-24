"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignInForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Sadece bir kez auth kontrolü yap
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        console.log("Checking if already logged in...")
        const res = await fetch("/api/user", {
          method: "GET",
          credentials: "include",
        })

        if (isMounted) {
          if (res.ok) {
            console.log("Already logged in, redirecting to app")
            router.replace("/app")
          } else {
            console.log("Not logged in, showing sign-in form")
            setAuthChecked(true)
          }
        }
      } catch (error) {
        console.error("Auth check error:", error)
        if (isMounted) {
          setAuthChecked(true)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Sign in attempt", { email })

    setError("")

    if (!email || !password) {
      setError("E-posta ve şifre gereklidir.")
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        console.log("Login successful!")
        // Başarılı giriş sonrası app sayfasına yönlendir
        router.replace("/app")
      } else {
        console.log("Login failed:", data.message)
        setError(data.message || "Geçersiz e-posta veya şifre. Lütfen tekrar deneyin.")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auth kontrolü tamamlanana kadar loading göster
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8faf8]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#79B791] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#13262F]/70">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8faf8]">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-sm border border-[#ABD1B5]/10">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <div className="text-[#79B791] font-semibold text-2xl relative">
              <span className="inline-block rounded-full bg-[#79B791] text-white px-2 py-0.5">é</span>
              <span className="text-[#13262F] ml-1">tude</span>
            </div>
          </div>
          <h2 className="text-2xl font-medium text-[#13262F]">Sign in to étude</h2>
          <p className="mt-2 text-sm text-[#13262F]/60">Enter your details to access your account</p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSignIn}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#13262F]/80 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-[#13262F] bg-white border border-[#ABD1B5]/40 rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791] focus:border-[#79B791] text-sm"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-[#13262F]/80">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-[#13262F] bg-white border border-[#ABD1B5]/40 rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791] focus:border-[#79B791] text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 text-white bg-[#79B791] rounded-md hover:bg-[#ABD1B5] focus:outline-none focus:ring-2 focus:ring-[#79B791] focus:ring-offset-2 transition-colors duration-200 text-sm font-medium disabled:opacity-70"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
          {error && <div className="mt-2 text-red-500 text-xs text-center">{error}</div>}
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-[#13262F]/70">
            Don't have an account?{" "}
            <Link href="/sign-up" className="font-medium text-[#79B791] hover:text-[#ABD1B5] focus:outline-none">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

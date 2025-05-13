"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  // Giriş yapmış kullanıcıyı yönlendirme
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/user")
        if (res.ok) {
          router.push("/app")
        }
      } catch (error) {
        console.error("Auth check error:", error)
      }
    }

    checkAuth()
  }, [router])

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Şifreler eşleşmiyor")
      return false
    }
    if (password.length < 6) {
      setPasswordError("Şifre en az 6 karakter olmalıdır")
      return false
    }
    setPasswordError("")
    return true
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    setFormSuccess("")

    if (!email || !password || !confirmPassword) {
      setFormError("Tüm zorunlu alanlar doldurulmalıdır.")
      return
    }

    if (!validatePasswords()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setFormSuccess(data.message + " Giriş sayfasına yönlendiriliyorsunuz...")

        // Redirect to sign-in page after a delay
        setTimeout(() => {
          router.push("/sign-in")
        }, 2000)
      } else {
        setFormError(data.message || "Kayıt sırasında bir hata oluştu.")
      }
    } catch (error) {
      console.error("Signup error:", error)
      setFormError("Ağ hatası veya sunucuya ulaşılamıyor.")
    } finally {
      setIsSubmitting(false)
    }
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
          <h2 className="text-2xl font-medium text-[#13262F]">Hesabınızı oluşturun</h2>
          <p className="mt-2 text-sm text-[#13262F]/60">étude'e başlamak için kaydolun</p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSignUp}>
          <div className="space-y-4">
            {/* İsim Alanı (Opsiyonel) */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#13262F]/80 mb-1">
                İsim (Opsiyonel)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-[#13262F] bg-white border border-[#ABD1B5]/40 rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791] focus:border-[#79B791] text-sm"
                placeholder="Adınız Soyadınız"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#13262F]/80 mb-1">
                E-posta
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
                placeholder="ornek@eposta.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#13262F]/80 mb-1">
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError && e.target.value.length >= 6 && e.target.value === confirmPassword) {
                    setPasswordError("")
                  }
                }}
                className="w-full px-3 py-2 text-[#13262F] bg-white border border-[#ABD1B5]/40 rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791] focus:border-[#79B791] text-sm"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-[#13262F]/60">Şifre en az 6 karakter olmalıdır.</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#13262F]/80 mb-1">
                Şifreyi Onayla
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (passwordError && password === e.target.value) {
                    setPasswordError("")
                  }
                }}
                onBlur={validatePasswords}
                className={`w-full px-3 py-2 text-[#13262F] bg-white border ${
                  passwordError ? "border-red-400" : "border-[#ABD1B5]/40"
                } rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791] focus:border-[#79B791] text-sm`}
                placeholder="••••••••"
              />
              {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
            </div>
          </div>

          {formError && <p className="text-xs text-red-500 text-center">{formError}</p>}
          {formSuccess && <p className="text-xs text-green-600 text-center">{formSuccess}</p>}

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
                  Hesap oluşturuluyor...
                </span>
              ) : (
                "Kaydol"
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <p className="text-sm text-[#13262F]/70">
            Zaten bir hesabınız var mı?{" "}
            <Link href="/sign-in" className="font-medium text-[#79B791] hover:text-[#ABD1B5] focus:outline-none">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AccountSettings() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })
  const router = useRouter()

  // Kullanıcı bilgilerini getir
  useEffect(() => {
    async function fetchUserData() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/user")

        if (!response.ok) {
          if (response.status === 401) {
            // Kullanıcı giriş yapmamış, giriş sayfasına yönlendir
            router.push("/sign-in")
            return
          }
          throw new Error("Failed to fetch user data")
        }

        const data = await response.json()
        setName(data.user.name || "")
        setEmail(data.user.email || "")
      } catch (error) {
        console.error("Error fetching user data:", error)
        setMessage({ text: "Kullanıcı bilgileri yüklenemedi.", type: "error" })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  // Kullanıcı bilgilerini güncelle
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSaving(true)
      setMessage({ text: "", type: "" })

      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user data")
      }

      setMessage({ text: "Bilgileriniz başarıyla güncellendi.", type: "success" })
    } catch (error) {
      console.error("Error updating user data:", error)
      setMessage({ text: "Bilgileriniz güncellenirken bir hata oluştu.", type: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  // Hesap silme işlemini başlat
  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true)
  }

  // Hesap silme işlemini onayla
  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch("/api/user", {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete account")
      }

      // Başarılı mesajı göster ve ana sayfaya yönlendir
      setMessage({ text: "Hesabınız başarıyla silindi.", type: "success" })
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Error deleting account:", error)
      setMessage({ text: "Hesabınız silinirken bir hata oluştu.", type: "error" })
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Hesap silme işlemini iptal et
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-[#13262F]">Hesap Ayarları</h1>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-[#79B791] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {message.text && (
            <div
              className={`p-3 mb-4 rounded-md ${
                message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-[#13262F] mb-1">
                Ad Soyad
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791]"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-[#13262F] mb-1">
                E-posta Adresi
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">E-posta adresi değiştirilemez.</p>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#79B791]/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Hesabı Sil
              </button>
            </div>
          </form>

          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-[#13262F]">Hesabınızı Silmek İstiyor musunuz?</h2>
                <p className="mb-6 text-gray-600">
                  Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Siliniyor..." : "Evet, Hesabımı Sil"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

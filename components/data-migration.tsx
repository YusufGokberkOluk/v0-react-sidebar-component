"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DataMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })
  const [localStoragePages, setLocalStoragePages] = useState<any[]>([])
  const [migratedCount, setMigratedCount] = useState(0)
  const router = useRouter()

  // localStorage'dan sayfa verilerini yükle
  useEffect(() => {
    try {
      // localStorage'dan sayfa verilerini al
      const pagesData = localStorage.getItem("pages")

      if (pagesData) {
        const pages = JSON.parse(pagesData)
        setLocalStoragePages(Array.isArray(pages) ? pages : [])
      }
    } catch (error) {
      console.error("Error loading localStorage data:", error)
      setMessage({ text: "localStorage verilerini yüklerken hata oluştu.", type: "error" })
    }
  }, [])

  // Veri geçişini başlat
  const handleStartMigration = async () => {
    if (localStoragePages.length === 0) {
      setMessage({ text: "Aktarılacak veri bulunamadı.", type: "warning" })
      return
    }

    setIsLoading(true)
    setMessage({ text: "", type: "" })
    setMigratedCount(0)

    try {
      // Her sayfa için MongoDB'ye kaydet
      for (const page of localStoragePages) {
        const response = await fetch("/api/pages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: page.title || "Untitled",
            content: page.content || "",
            tags: page.tags || [],
            isFavorite: page.isFavorite || false,
          }),
        })

        if (response.ok) {
          setMigratedCount((prev) => prev + 1)
        }
      }

      setMessage({
        text: `${migratedCount} sayfa başarıyla MongoDB'ye aktarıldı.`,
        type: "success",
      })

      // Başarılı geçişten sonra localStorage'ı temizle
      localStorage.removeItem("pages")
    } catch (error) {
      console.error("Error migrating data:", error)
      setMessage({
        text: "Veri geçişi sırasında bir hata oluştu.",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Geçişi atla ve uygulamaya devam et
  const handleSkipMigration = () => {
    router.push("/app")
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-[#13262F]">Veri Geçişi</h1>

      <p className="mb-4 text-gray-600">
        Uygulamanız artık verileri tarayıcınızda değil, güvenli bir veritabanında saklıyor. Mevcut verilerinizi yeni
        sisteme aktarmak ister misiniz?
      </p>

      {message.text && (
        <div
          className={`p-3 mb-4 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : message.type === "warning"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mb-4">
        <p className="font-medium text-[#13262F]">Aktarılacak veri: {localStoragePages.length} sayfa</p>

        {migratedCount > 0 && (
          <p className="text-sm text-green-600 mt-1">
            {migratedCount} / {localStoragePages.length} sayfa aktarıldı
          </p>
        )}

        {isLoading && (
          <div className="mt-2 flex items-center">
            <div className="w-4 h-4 border-2 border-[#79B791] border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-sm text-gray-600">Veriler aktarılıyor...</span>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleStartMigration}
          disabled={isLoading || localStoragePages.length === 0}
          className="flex-1 px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#79B791]/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Aktarılıyor..." : "Verileri Aktar"}
        </button>

        <button
          onClick={handleSkipMigration}
          disabled={isLoading}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {localStoragePages.length === 0 ? "Devam Et" : "Atla"}
        </button>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Not: Veri geçişini atlarsanız, tarayıcınızda saklanan veriler kaybolabilir.
      </p>
    </div>
  )
}

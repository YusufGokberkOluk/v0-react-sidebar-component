"use client"

import { useState } from "react"

export default function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState("")
  const [migrationComplete, setMigrationComplete] = useState(false)

  const migrateData = async () => {
    setIsMigrating(true)
    setMigrationStatus("Veri geçişi başlatılıyor...")

    try {
      // 1. Kullanıcı tercihlerini geçir
      setMigrationStatus("Kullanıcı tercihleri geçiriliyor...")
      const darkMode = localStorage.getItem("theme") === "dark"

      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          darkMode,
          autoSave: true,
          emailNotifications: true,
          reminderNotifications: false,
        }),
      })

      // 2. Şablon favorilerini geçir
      setMigrationStatus("Şablon favorileri geçiriliyor...")
      const templateFavorites = JSON.parse(localStorage.getItem("templateFavorites") || "[]")

      for (const templateId of templateFavorites) {
        await fetch("/api/templates/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ templateId }),
        })
      }

      // 3. Görünüm modlarını geçir
      // Bu ayarlar kullanıcı tercihlerine dahil edilebilir

      setMigrationStatus("Veri geçişi tamamlandı!")
      setMigrationComplete(true)

      // 4. localStorage'ı temizle (isteğe bağlı)
      // localStorage.clear()
    } catch (error) {
      console.error("Veri geçişi hatası:", error)
      setMigrationStatus("Veri geçişi sırasında bir hata oluştu.")
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Veri Geçişi</h2>
      <p className="mb-4 text-sm text-gray-600">
        Bu işlem, localStorage'da saklanan verilerinizi MongoDB veritabanına aktaracaktır.
      </p>

      {migrationStatus && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
          <p>{migrationStatus}</p>
        </div>
      )}

      <button
        onClick={migrateData}
        disabled={isMigrating || migrationComplete}
        className={`w-full py-2 rounded-md ${
          migrationComplete
            ? "bg-green-500 text-white"
            : isMigrating
              ? "bg-gray-400 text-white"
              : "bg-[#79B791] text-white hover:bg-[#ABD1B5]"
        } transition-colors`}
      >
        {migrationComplete ? "Geçiş Tamamlandı" : isMigrating ? "Geçiş Yapılıyor..." : "Veri Geçişini Başlat"}
      </button>

      {migrationComplete && (
        <p className="mt-4 text-sm text-green-600">
          Verileriniz başarıyla MongoDB'ye aktarıldı. Artık uygulamayı kullanmaya devam edebilirsiniz.
        </p>
      )}
    </div>
  )
}

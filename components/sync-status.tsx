"use client"

import { useState, useEffect } from "react"
import { Check, AlertCircle, RefreshCw } from "lucide-react"

export default function SyncStatus() {
  const [syncState, setSyncState] = useState<"synced" | "syncing" | "error">("synced")
  const [lastSynced, setLastSynced] = useState<Date | null>(null)

  // Senkronizasyon durumunu dinle
  useEffect(() => {
    // Örnek: API isteklerini dinle
    const handleFetch = () => {
      setSyncState("syncing")
    }

    const handleFetchComplete = () => {
      setSyncState("synced")
      setLastSynced(new Date())
    }

    const handleFetchError = () => {
      setSyncState("error")
    }

    // Global fetch olaylarını dinle
    window.addEventListener("fetchstart", handleFetch)
    window.addEventListener("fetchcomplete", handleFetchComplete)
    window.addEventListener("fetcherror", handleFetchError)

    return () => {
      window.removeEventListener("fetchstart", handleFetch)
      window.removeEventListener("fetchcomplete", handleFetchComplete)
      window.removeEventListener("fetcherror", handleFetchError)
    }
  }, [])

  // Formatlanmış son senkronizasyon zamanı
  const formattedLastSynced = lastSynced
    ? lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div className="flex items-center text-xs">
      {syncState === "synced" && (
        <>
          <Check className="h-3 w-3 text-green-500 mr-1" />
          <span className="text-[#13262F]/60">
            {formattedLastSynced ? `Son senkronizasyon: ${formattedLastSynced}` : "Senkronize edildi"}
          </span>
        </>
      )}

      {syncState === "syncing" && (
        <>
          <RefreshCw className="h-3 w-3 text-blue-500 mr-1 animate-spin" />
          <span className="text-[#13262F]/60">Senkronize ediliyor...</span>
        </>
      )}

      {syncState === "error" && (
        <>
          <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
          <span className="text-red-500">Senkronizasyon hatası</span>
        </>
      )}
    </div>
  )
}

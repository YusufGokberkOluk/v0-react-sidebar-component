"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X, FileText, User, Calendar, Shield, ShieldCheck } from "lucide-react"

interface InviteData {
  pageTitle: string
  sharedByName: string
  sharedWithEmail: string
  accessLevel: "view" | "edit"
  createdAt: string
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [inviteData, setInviteData] = useState<InviteData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const fetchInviteData = async () => {
      try {
        const response = await fetch(`/api/invites/${params.token}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setInviteData(data.invite)
        } else {
          setError(data.message || "Davet bilgileri alınamadı")
        }
      } catch (error) {
        console.error("Error fetching invite data:", error)
        setError("Davet bilgileri yüklenirken bir hata oluştu")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInviteData()
  }, [params.token])

  const handleAccept = async () => {
    try {
      setIsProcessing(true)
      setError("")

      const response = await fetch(`/api/invites/${params.token}`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess("Davet kabul edildi! Sayfaya yönlendiriliyorsunuz...")

        // 2 saniye sonra sayfaya yönlendir
        setTimeout(() => {
          router.push(`/app?page=${data.pageId}`)
        }, 2000)
      } else {
        setError(data.message || "Davet kabul edilirken bir hata oluştu")
      }
    } catch (error) {
      console.error("Error accepting invite:", error)
      setError("Davet kabul edilirken bir hata oluştu")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsProcessing(true)
      setError("")

      const response = await fetch(`/api/invites/${params.token}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess("Davet reddedildi.")

        // 2 saniye sonra ana sayfaya yönlendir
        setTimeout(() => {
          router.push("/app")
        }, 2000)
      } else {
        setError(data.message || "Davet reddedilirken bir hata oluştu")
      }
    } catch (error) {
      console.error("Error rejecting invite:", error)
      setError("Davet reddedilirken bir hata oluştu")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#79B791] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#13262F]/70">Davet bilgileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-[#ABD1B5]/10">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[#13262F] mb-2">Geçersiz Davet</h1>
            <p className="text-[#13262F]/70 mb-6">{error}</p>
            <button
              onClick={() => router.push("/app")}
              className="px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#ABD1B5] transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-[#ABD1B5]/10">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-[#13262F] mb-2">Başarılı!</h1>
            <p className="text-[#13262F]/70">{success}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-[#ABD1B5]/10">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[#EDF4ED] rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-[#79B791]" />
          </div>
          <h1 className="text-xl font-bold text-[#13262F] mb-2">Sayfa Paylaşım Daveti</h1>
          <p className="text-[#13262F]/70">Sizinle bir sayfa paylaşıldı</p>
        </div>

        {inviteData && (
          <div className="space-y-4 mb-6">
            <div className="p-4 bg-[#EDF4ED] rounded-lg">
              <h2 className="font-semibold text-[#13262F] mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                {inviteData.pageTitle}
              </h2>

              <div className="space-y-2 text-sm text-[#13262F]/80">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>Paylaşan: {inviteData.sharedByName}</span>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Tarih: {formatDate(inviteData.createdAt)}</span>
                </div>

                <div className="flex items-center">
                  {inviteData.accessLevel === "edit" ? (
                    <ShieldCheck className="h-4 w-4 mr-2" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  <span>Erişim: {inviteData.accessLevel === "edit" ? "Düzenleme" : "Görüntüleme"}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Not:</strong> Bu davet {inviteData.sharedWithEmail} e-posta adresine gönderilmiştir. Daveti
                kabul etmek için bu e-posta adresiyle giriş yapmış olmanız gerekir.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleAccept}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#ABD1B5] disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Kabul Et
          </button>

          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 transition-colors flex items-center justify-center"
          >
            <X className="h-4 w-4 mr-2" />
            Reddet
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/app")}
            className="text-sm text-[#79B791] hover:text-[#ABD1B5] transition-colors"
          >
            Ana sayfaya dön
          </button>
        </div>
      </div>
    </div>
  )
}

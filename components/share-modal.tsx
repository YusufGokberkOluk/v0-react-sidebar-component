"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Copy, Users, Link, Lock, Check, Trash2, Mail } from "lucide-react"

interface ShareModalProps {
  pageId: string
  onClose: () => void
}

type AccessLevel = "view" | "edit"

interface PageShare {
  _id: string
  sharedWithEmail: string
  accessLevel: AccessLevel
  status: "pending" | "accepted" | "rejected"
  createdAt: string
}

export default function ShareModal({ pageId, onClose }: ShareModalProps) {
  const [email, setEmail] = useState("")
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("view")
  const [shareLink, setShareLink] = useState(`${window.location.origin}/share/${pageId}`)
  const [shares, setShares] = useState<PageShare[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [linkCopied, setLinkCopied] = useState(false)

  // Sayfa paylaşımlarını getir
  useEffect(() => {
    const fetchShares = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/pages/${pageId}/share`)

        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setShares(data.shares)
          }
        } else {
          console.error("Failed to fetch shares")
        }
      } catch (error) {
        console.error("Error fetching shares:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShares()
  }, [pageId])

  const handleInvite = async () => {
    if (!email.trim()) return

    try {
      setError("")
      setSuccess("")
      setIsSubmitting(true)

      const response = await fetch(`/api/pages/${pageId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          accessLevel,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(`${email} başarıyla davet edildi.`)
        setEmail("")

        // Paylaşımları yeniden yükle
        const sharesResponse = await fetch(`/api/pages/${pageId}/share`)
        if (sharesResponse.ok) {
          const sharesData = await sharesResponse.json()
          if (sharesData.success) {
            setShares(sharesData.shares)
          }
        }
      } else {
        setError(data.message || "Davet gönderilirken bir hata oluştu.")
      }
    } catch (error) {
      console.error("Error inviting user:", error)
      setError("Davet gönderilirken bir hata oluştu.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy link:", err)
      })
  }

  const handleAccessChange = (level: AccessLevel) => {
    setAccessLevel(level)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleInvite()
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/shares/${shareId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Paylaşımı listeden kaldır
        setShares(shares.filter((share) => share._id !== shareId))
      } else {
        console.error("Failed to remove share")
      }
    } catch (error) {
      console.error("Error removing share:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Bekliyor"
      case "accepted":
        return "Kabul Edildi"
      case "rejected":
        return "Reddedildi"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "accepted":
        return "text-green-600 bg-green-100"
      case "rejected":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#EDF4ED] rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#13262F]">Paylaş</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[#ABD1B5]/20" aria-label="Kapat">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Kişilerle Paylaş */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#13262F] mb-2 flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Kişilerle Paylaş
          </h3>
          <div className="flex">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="E-posta adresi girin"
              className="flex-1 px-3 py-2 border border-[#ABD1B5] rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#79B791] focus:border-transparent"
            />
            <button
              onClick={handleInvite}
              disabled={!email.trim() || isSubmitting}
              className="px-4 py-2 bg-[#79B791] text-white rounded-r-md hover:bg-[#ABD1B5] disabled:opacity-50 disabled:hover:bg-[#79B791] transition-colors"
            >
              {isSubmitting ? "Gönderiliyor..." : "Davet Et"}
            </button>
          </div>
          <div className="flex mt-2 space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="accessLevel"
                checked={accessLevel === "view"}
                onChange={() => handleAccessChange("view")}
                className="h-4 w-4 text-[#79B791] border-[#ABD1B5] focus:ring-[#79B791]"
              />
              <span className="text-sm text-[#13262F]">Görüntüleme</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="accessLevel"
                checked={accessLevel === "edit"}
                onChange={() => handleAccessChange("edit")}
                className="h-4 w-4 text-[#79B791] border-[#ABD1B5] focus:ring-[#79B791]"
              />
              <span className="text-sm text-[#13262F]">Düzenleme</span>
            </label>
          </div>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          {success && <p className="mt-2 text-xs text-green-600">{success}</p>}
        </div>

        {/* Paylaşım Listesi */}
        {shares.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[#13262F] mb-2">Paylaşılan Kişiler</h3>
            <div className="max-h-40 overflow-y-auto">
              <ul className="space-y-2">
                {shares.map((share) => (
                  <li
                    key={share._id}
                    className="flex items-center justify-between p-2 bg-white rounded-md border border-[#ABD1B5]/20"
                  >
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-[#79B791] mr-2" />
                      <div>
                        <p className="text-sm font-medium text-[#13262F]">{share.sharedWithEmail}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-[#13262F]/70">
                            {share.accessLevel === "edit" ? "Düzenleyebilir" : "Görüntüleyebilir"}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(share.status)}`}>
                            {getStatusText(share.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveShare(share._id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                      aria-label="Paylaşımı kaldır"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Genel Erişim */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[#13262F] mb-2 flex items-center">
            <Link className="h-4 w-4 mr-2" />
            Genel Erişim
          </h3>
          <div className="flex items-center justify-between p-3 bg-white rounded-md border border-[#ABD1B5] mb-4">
            <span className="text-sm text-[#13262F] truncate flex-1">{shareLink}</span>
            <button
              onClick={handleCopyLink}
              className="ml-2 p-1.5 rounded hover:bg-[#ABD1B5]/20 transition-colors"
              aria-label="Bağlantıyı kopyala"
              title="Bağlantıyı kopyala"
            >
              {linkCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2 p-2 rounded hover:bg-[#ABD1B5]/10 cursor-pointer">
              <input
                type="radio"
                name="access"
                checked={true}
                className="h-4 w-4 text-[#79B791] border-[#ABD1B5] focus:ring-[#79B791]"
              />
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-2 text-[#13262F]" />
                <div>
                  <p className="text-sm font-medium text-[#13262F]">Kısıtlı</p>
                  <p className="text-xs text-[#13262F]/70">Sadece davet ettiğiniz kişiler erişebilir</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#ABD1B5] transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}

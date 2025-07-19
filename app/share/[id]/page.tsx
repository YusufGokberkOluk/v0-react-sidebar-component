"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, User, Calendar, Eye, ArrowLeft, Share2 } from "lucide-react"
import Link from "next/link"

interface SharedPage {
  _id: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  owner: {
    name: string
    email: string
  }
}

export default function SharedPageView({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [page, setPage] = useState<SharedPage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchSharedPage = async () => {
      try {
        const response = await fetch(`/api/share/${params.id}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setPage(data.page)
        } else {
          setError(data.message || "Sayfa yüklenemedi")
        }
      } catch (error) {
        console.error("Error fetching shared page:", error)
        setError("Sayfa yüklenirken bir hata oluştu")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSharedPage()
  }, [params.id])

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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: page?.title || "Paylaşılan Sayfa",
          text: "Bu sayfayı kontrol edin!",
          url: window.location.href,
        })
      } catch (error) {
        console.log("Paylaşım iptal edildi")
      }
    } else {
      // Fallback: URL'yi kopyala
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Link kopyalandı!")
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-[#79B791] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-[#13262F]/70">Sayfa yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-sm border border-[#ABD1B5]/10">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-[#13262F] mb-2">Sayfa Bulunamadı</h1>
            <p className="text-[#13262F]/70 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#ABD1B5] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!page) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#f8faf8]">
      {/* Header */}
      <header className="bg-white border-b border-[#ABD1B5]/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-[#79B791] hover:text-[#ABD1B5] transition-colors">
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">étude</span>
              </Link>
              <div className="flex items-center text-[#13262F]/60">
                <Eye className="h-4 w-4 mr-1" />
                <span className="text-sm">Salt Okunur</span>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center px-3 py-1.5 bg-[#79B791] text-white rounded-md hover:bg-[#ABD1B5] transition-colors text-sm"
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Paylaş
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Info */}
        <div className="bg-white rounded-lg shadow-sm border border-[#ABD1B5]/10 p-6 mb-6">
          <h1 className="text-2xl font-bold text-[#13262F] mb-4">{page.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#13262F]/70 mb-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              <span>Yazan: {page.owner.name}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Oluşturulma: {formatDate(page.createdAt)}</span>
            </div>
            {page.updatedAt !== page.createdAt && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Güncelleme: {formatDate(page.updatedAt)}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {page.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {page.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 bg-[#EDF4ED] text-[#13262F] text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Page Content */}
        <div className="bg-white rounded-lg shadow-sm border border-[#ABD1B5]/10 p-6">
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-[#13262F] leading-relaxed">{page.content || "Bu sayfa boş."}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#13262F]/60 mb-4">
            Bu sayfa <strong>étude</strong> ile oluşturulmuştur
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#ABD1B5] transition-colors text-sm"
          >
            Ücretsiz Hesap Oluştur
          </Link>
        </div>
      </main>
    </div>
  )
}

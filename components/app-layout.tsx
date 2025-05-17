"use client"

import { useState, useEffect } from "react"
import Sidebar from "./sidebar"
import Editor from "./editor"
import { useRouter } from "next/navigation"

type SaveStatus = "idle" | "saving" | "saved" | "error"

interface Page {
  _id: string
  title: string
  content: string
  tags: string[]
  isFavorite: boolean
  userId: string
  createdAt: string
  updatedAt: string
}

export default function AppLayout() {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Kullanıcının sayfalarını getir
  useEffect(() => {
    async function fetchPages() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/pages")

        if (!response.ok) {
          if (response.status === 401) {
            // Kullanıcı giriş yapmamış, giriş sayfasına yönlendir
            router.push("/sign-in")
            return
          }
          throw new Error("Failed to fetch pages")
        }

        const data = await response.json()
        setPages(data.pages)

        // İlk sayfayı seç (eğer sayfa varsa)
        if (data.pages.length > 0) {
          setSelectedPageId(data.pages[0]._id)
        }
      } catch (error) {
        console.error("Error fetching pages:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPages()
  }, [router])

  // Seçili sayfayı bul
  const selectedPage = selectedPageId ? pages.find((page) => page._id === selectedPageId) : null

  // Sayfa kaydetme fonksiyonu
  const savePage = async (pageId: string, updateData: Partial<Page>) => {
    setSaveStatus("saving")

    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Failed to save page")
      }

      const data = await response.json()

      // Sayfalar listesini güncelle
      setPages(pages.map((page) => (page._id === pageId ? { ...page, ...data.page } : page)))

      setSaveStatus("saved")
    } catch (error) {
      console.error("Error saving page:", error)
      setSaveStatus("error")
    }
  }

  // Otomatik kaydetme fonksiyonu
  const triggerSave = (pageId: string, updateData: Partial<Page>) => {
    // Mevcut zamanlayıcıyı temizle
    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    // Yeni bir zamanlayıcı ayarla
    const timer = setTimeout(() => {
      savePage(pageId, updateData)
    }, 1000)

    setSaveTimer(timer)
    setSaveStatus("idle")
  }

  // Sayfalar arasında gezinme
  const handleNavigate = (pageId: string) => {
    setSelectedPageId(pageId)
  }

  // Favori durumunu değiştirme
  const handleToggleFavorite = async (pageId: string) => {
    const page = pages.find((p) => p._id === pageId)

    if (page) {
      // Kullanıcı arayüzünü hemen güncelle (optimistik güncelleme)
      setPages(pages.map((p) => (p._id === pageId ? { ...p, isFavorite: !p.isFavorite } : p)))

      // Veritabanını güncelle
      await savePage(pageId, { isFavorite: !page.isFavorite })
    }
  }

  // İçerik değişikliklerini işleme
  const handleContentChange = (newContent: string) => {
    if (selectedPageId && selectedPage) {
      // Kullanıcı arayüzünü hemen güncelle
      setPages(pages.map((page) => (page._id === selectedPageId ? { ...page, content: newContent } : page)))

      // Otomatik kaydetmeyi tetikle
      triggerSave(selectedPageId, { content: newContent })
    }
  }

  // Etiket değişikliklerini işleme
  const handleTagsChange = (newTags: string[]) => {
    if (selectedPageId && selectedPage) {
      // Kullanıcı arayüzünü hemen güncelle
      setPages(pages.map((page) => (page._id === selectedPageId ? { ...page, tags: newTags } : page)))

      // Otomatik kaydetmeyi tetikle
      triggerSave(selectedPageId, { tags: newTags })
    }
  }

  // Yeni sayfa oluşturma
  const handleCreatePage = async () => {
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Yeni Sayfa",
          content: "",
          tags: [],
          isFavorite: false,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create page")
      }

      const data = await response.json()

      // Yeni sayfayı listeye ekle
      setPages([...pages, data.page])

      // Yeni sayfayı seç
      setSelectedPageId(data.page._id)
    } catch (error) {
      console.error("Error creating page:", error)
    }
  }

  // Sayfa silme
  const handleDeletePage = async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete page")
      }

      // Sayfayı listeden kaldır
      setPages(pages.filter((page) => page._id !== pageId))

      // Eğer silinen sayfa seçili sayfaysa, başka bir sayfayı seç
      if (selectedPageId === pageId) {
        const remainingPages = pages.filter((page) => page._id !== pageId)
        setSelectedPageId(remainingPages.length > 0 ? remainingPages[0]._id : null)
      }
    } catch (error) {
      console.error("Error deleting page:", error)
    }
  }

  // Zamanlayıcıyı temizle
  useEffect(() => {
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer)
      }
    }
  }, [saveTimer])

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar
            pages={pages}
            selectedPageId={selectedPageId || ""}
            onNavigate={handleNavigate}
            onToggleFavorite={handleToggleFavorite}
            onCreatePage={handleCreatePage}
            onDeletePage={handleDeletePage}
            isLoading={isLoading}
          />
        </div>
        <div className="flex-1 p-2 md:p-4 overflow-auto bg-[#f8faf8]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-[#79B791] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedPage ? (
            <Editor
              title={selectedPage.title}
              pageId={selectedPage._id}
              initialContent={selectedPage.content}
              initialTags={selectedPage.tags}
              saveStatus={saveStatus}
              onChange={handleContentChange}
              onTagsChange={handleTagsChange}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#13262F]/70">
              <p className="mb-4">Henüz hiç sayfa yok.</p>
              <button
                onClick={handleCreatePage}
                className="px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#79B791]/90 transition-colors"
              >
                Yeni Sayfa Oluştur
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

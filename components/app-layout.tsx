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
  const [isCreatingPage, setIsCreatingPage] = useState(false) // Yeni sayfa oluşturma durumu
  const router = useRouter()

  // Kullanıcının sayfalarını getir
  const fetchPages = async () => {
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

      // İlk sayfayı seç (eğer sayfa varsa ve hiçbiri seçili değilse)
      if (data.pages.length > 0 && !selectedPageId) {
        setSelectedPageId(data.pages[0]._id)
      }
    } catch (error) {
      console.error("Error fetching pages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
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
      setPages((prevPages) => prevPages.map((page) => (page._id === pageId ? { ...page, ...data.page } : page)))

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
  const handleNavigate = async (pageId: string) => {
    try {
      // Sayfa erişim kontrolü
      const response = await fetch(`/api/pages/${pageId}`)

      if (response.ok) {
        const data = await response.json()

        if (data.success) {
          setSelectedPageId(pageId)

          // Erişim seviyesine göre UI'ı güncelle
          if (data.accessLevel === "view") {
            // Salt okunur mod
            // Burada düzenleme butonlarını devre dışı bırakabilirsiniz
            console.log("View-only access")
          }
        } else {
          console.error("Failed to access page:", data.message)
          alert("Bu sayfaya erişim yetkiniz yok.")
        }
      } else {
        console.error("Failed to check page access")
      }
    } catch (error) {
      console.error("Error navigating to page:", error)
    }
  }

  // Favori durumunu değiştirme
  const handleToggleFavorite = async (pageId: string) => {
    const page = pages.find((p) => p._id === pageId)

    if (page) {
      // Kullanıcı arayüzünü hemen güncelle (optimistik güncelleme)
      setPages((prevPages) => prevPages.map((p) => (p._id === pageId ? { ...p, isFavorite: !p.isFavorite } : p)))

      // Veritabanını güncelle
      await savePage(pageId, { isFavorite: !page.isFavorite })
    }
  }

  // İçerik değişikliklerini işleme
  const handleContentChange = (newContent: string) => {
    if (selectedPageId && selectedPage) {
      // Kullanıcı arayüzünü hemen güncelle
      setPages((prevPages) =>
        prevPages.map((page) => (page._id === selectedPageId ? { ...page, content: newContent } : page)),
      )

      // Otomatik kaydetmeyi tetikle
      triggerSave(selectedPageId, { content: newContent })
    }
  }

  // Başlık değişikliklerini işleme
  const handleTitleChange = (newTitle: string) => {
    if (selectedPageId && selectedPage) {
      // Kullanıcı arayüzünü hemen güncelle
      setPages((prevPages) =>
        prevPages.map((page) => (page._id === selectedPageId ? { ...page, title: newTitle } : page)),
      )

      // Otomatik kaydetmeyi tetikle
      triggerSave(selectedPageId, { title: newTitle })
    }
  }

  // Etiket değişikliklerini işleme
  const handleTagsChange = (newTags: string[]) => {
    if (selectedPageId && selectedPage) {
      // Kullanıcı arayüzünü hemen güncelle
      setPages((prevPages) =>
        prevPages.map((page) => (page._id === selectedPageId ? { ...page, tags: newTags } : page)),
      )

      // Otomatik kaydetmeyi tetikle
      triggerSave(selectedPageId, { tags: newTags })
    }
  }

  // Yeni sayfa oluşturma - race condition'ı önlemek için düzeltildi
  const handleCreatePage = async () => {
    // Eğer zaten sayfa oluşturuluyorsa, işlemi engelle
    if (isCreatingPage) {
      return
    }

    setIsCreatingPage(true)

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

      // Yeni sayfayı listeye ekle - functional update kullan
      setPages((prevPages) => {
        // Aynı ID'ye sahip sayfa zaten varsa ekleme
        if (prevPages.some((page) => page._id === data.page._id)) {
          return prevPages
        }
        return [...prevPages, data.page]
      })

      // Yeni sayfayı seç
      setSelectedPageId(data.page._id)

      // Sayfaları yeniden getir (senkronizasyon için)
      setTimeout(() => {
        fetchPages()
      }, 500)
    } catch (error) {
      console.error("Error creating page:", error)
    } finally {
      setIsCreatingPage(false)
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
      setPages((prevPages) => prevPages.filter((page) => page._id !== pageId))

      // Eğer silinen sayfa seçili sayfaysa, başka bir sayfayı seç
      if (selectedPageId === pageId) {
        setPages((prevPages) => {
          const remainingPages = prevPages.filter((page) => page._id !== pageId)
          setSelectedPageId(remainingPages.length > 0 ? remainingPages[0]._id : null)
          return remainingPages
        })
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
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-80 flex-shrink-0 border-r border-gray-200">
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
      <div className="flex-1 bg-white">
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
            onTitleChange={handleTitleChange}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#13262F]/70">
            <p className="mb-4">Henüz hiç sayfa yok.</p>
            <button
              onClick={handleCreatePage}
              disabled={isCreatingPage}
              className="px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#79B791]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingPage ? "Oluşturuluyor..." : "Yeni Sayfa Oluştur"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

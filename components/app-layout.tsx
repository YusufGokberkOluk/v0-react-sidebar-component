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
  workspaceId: string // workspaceId eklendi
  createdAt: string
  updatedAt: string
}

interface Workspace {
  _id: string
  name: string
  ownerId: string
  isDefault: boolean
  createdAt: string
}

export default function AppLayout() {
  const [pages, setPages] = useState<Page[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Kullanıcının workspace'lerini getir
  useEffect(() => {
    async function fetchWorkspaces() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/workspaces")

        if (!response.ok) {
          if (response.status === 401) {
            // Kullanıcı giriş yapmamış, giriş sayfasına yönlendir
            router.push("/sign-in")
            return
          }
          throw new Error("Failed to fetch workspaces")
        }

        const data = await response.json()
        setWorkspaces(data.workspaces)

        // İlk workspace'i seç (eğer workspace varsa)
        if (data.workspaces.length > 0) {
          setSelectedWorkspaceId(data.workspaces[0]._id)

          // Seçili workspace'in sayfalarını getir
          fetchWorkspacePages(data.workspaces[0]._id)
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error fetching workspaces:", error)
        setIsLoading(false)
      }
    }

    fetchWorkspaces()
  }, [router])

  // Seçili workspace'in sayfalarını getir
  const fetchWorkspacePages = async (workspaceId: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/pages`)

      if (!response.ok) {
        throw new Error("Failed to fetch workspace pages")
      }

      const data = await response.json()
      setPages(data.pages)

      // İlk sayfayı seç (eğer sayfa varsa)
      if (data.pages.length > 0) {
        setSelectedPageId(data.pages[0]._id)
      }
    } catch (error) {
      console.error("Error fetching workspace pages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Workspace seçimi - Kullanıcı sadece bir workspace'e sahip olduğu için bu fonksiyon kullanılmayacak
  const handleSelectWorkspace = (workspaceId: string) => {
    if (workspaceId === selectedWorkspaceId) return

    setSelectedWorkspaceId(workspaceId)
    fetchWorkspacePages(workspaceId)
  }

  // Yeni workspace oluşturma - Kullanıcı sadece bir workspace'e sahip olduğu için bu fonksiyon kullanılmayacak
  const handleCreateWorkspace = async () => {
    try {
      // Kullanıcının zaten bir workspace'i var mı kontrol et
      if (workspaces.length > 0) {
        alert("Sadece bir workspace kullanabilirsiniz.")
        return
      }

      const workspaceName = prompt("Enter workspace name:")
      if (!workspaceName) return

      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: workspaceName,
          isDefault: true,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.message || "Failed to create workspace")
        return
      }

      const data = await response.json()

      // Workspace'leri güncelle
      setWorkspaces([...workspaces, data.workspace])

      // Yeni workspace'i seç
      setSelectedWorkspaceId(data.workspace._id)
      fetchWorkspacePages(data.workspace._id)
    } catch (error) {
      console.error("Error creating workspace:", error)
      alert("Failed to create workspace")
    }
  }

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

  // Başlık değişikliklerini işleme
  const handleTitleChange = (newTitle: string) => {
    if (selectedPageId && selectedPage) {
      // Kullanıcı arayüzünü hemen güncelle
      setPages(pages.map((page) => (page._id === selectedPageId ? { ...page, title: newTitle } : page)))

      // Otomatik kaydetmeyi tetikle
      triggerSave(selectedPageId, { title: newTitle })
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
    if (!selectedWorkspaceId) {
      alert("Lütfen önce bir çalışma alanı seçin.")
      return
    }

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
          workspaceId: selectedWorkspaceId,
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
    <div className="flex h-screen w-full overflow-hidden">
      <div className="w-80 flex-shrink-0 border-r border-gray-200">
        <Sidebar
          pages={pages}
          selectedPageId={selectedPageId || ""}
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId || ""}
          onNavigate={handleNavigate}
          onToggleFavorite={handleToggleFavorite}
          onCreatePage={handleCreatePage}
          onDeletePage={handleDeletePage}
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
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
            <p className="mb-4">
              {selectedWorkspaceId
                ? "Bu çalışma alanında henüz sayfa yok."
                : "Lütfen bir çalışma alanı seçin veya oluşturun."}
            </p>
            {selectedWorkspaceId && (
              <button
                onClick={handleCreatePage}
                className="px-4 py-2 bg-[#79B791] text-white rounded-md hover:bg-[#79B791]/90 transition-colors"
              >
                Yeni Sayfa Oluştur
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

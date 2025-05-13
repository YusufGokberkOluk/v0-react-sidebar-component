"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Page, User, UserPreferences } from "@/lib/db-types"

interface AppContextType {
  user: User | null
  pages: Page[]
  selectedPageId: string | null
  userPreferences: UserPreferences
  favoriteTemplateIds: string[]
  setSelectedPageId: (id: string) => void
  updatePage: (pageId: string, data: Partial<Page>) => Promise<void>
  createPage: (data: Partial<Page>) => Promise<Page | null>
  deletePage: (pageId: string) => Promise<boolean>
  toggleTemplateFavorite: (templateId: string) => Promise<void>
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    darkMode: false,
    autoSave: true,
    emailNotifications: true,
    reminderNotifications: false,
  })
  const [favoriteTemplateIds, setFavoriteTemplateIds] = useState<string[]>([])

  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user")
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.user) {
            setUser(data.user)
            if (data.user.preferences) {
              setUserPreferences(data.user.preferences)
            }
          }
        }
      } catch (error) {
        console.error("Kullanıcı bilgileri yüklenirken hata:", error)
      }
    }

    fetchUser()
  }, [])

  // Sayfaları yükle
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await fetch("/api/pages")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setPages(data.pages)
            if (data.pages.length > 0 && !selectedPageId) {
              setSelectedPageId(data.pages[0]._id)
            }
          }
        }
      } catch (error) {
        console.error("Sayfalar yüklenirken hata:", error)
      }
    }

    fetchPages()
  }, [selectedPageId])

  // Favori şablonları yükle
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch("/api/templates/favorites")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setFavoriteTemplateIds(data.favorites)
          }
        }
      } catch (error) {
        console.error("Favoriler yüklenirken hata:", error)
      }
    }

    fetchFavorites()
  }, [])

  // Sayfa güncelleme
  const updatePage = async (pageId: string, data: Partial<Page>) => {
    try {
      // Önce state'i güncelle (UI için)
      setPages(pages.map((page) => (page._id === pageId ? { ...page, ...data } : page)))

      // Sonra API'ye gönder
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        // Hata durumunda state'i geri al
        const originalPages = [...pages]
        setPages(originalPages)
        throw new Error("Sayfa güncellenemedi")
      }
    } catch (error) {
      console.error("Sayfa güncellenirken hata:", error)
      throw error
    }
  }

  // Yeni sayfa oluşturma
  const createPage = async (data: Partial<Page>): Promise<Page | null> => {
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.page) {
          // State'e ekle
          setPages([...pages, result.page])
          return result.page
        }
      }

      return null
    } catch (error) {
      console.error("Sayfa oluşturulurken hata:", error)
      return null
    }
  }

  // Sayfa silme
  const deletePage = async (pageId: string): Promise<boolean> => {
    try {
      // Önce state'den kaldır (UI için)
      const originalPages = [...pages]
      setPages(pages.filter((page) => page._id !== pageId))

      // Sonra API'ye gönder
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        // Hata durumunda state'i geri al
        setPages(originalPages)
        return false
      }

      return true
    } catch (error) {
      console.error("Sayfa silinirken hata:", error)
      return false
    }
  }

  // Şablon favorilerini değiştirme
  const toggleTemplateFavorite = async (templateId: string) => {
    try {
      const isFavorite = favoriteTemplateIds.includes(templateId)

      // Önce state'i güncelle (UI için)
      if (isFavorite) {
        setFavoriteTemplateIds(favoriteTemplateIds.filter((id) => id !== templateId))
      } else {
        setFavoriteTemplateIds([...favoriteTemplateIds, templateId])
      }

      // Sonra API'ye gönder
      const response = await fetch("/api/templates/favorites", {
        method: isFavorite ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ templateId }),
      })

      if (!response.ok) {
        // Hata durumunda state'i geri al
        const originalFavorites = [...favoriteTemplateIds]
        setFavoriteTemplateIds(originalFavorites)
        throw new Error("Favori işlemi başarısız")
      }
    } catch (error) {
      console.error("Favori işlemi hatası:", error)
      throw error
    }
  }

  // Kullanıcı tercihlerini güncelleme
  const updateUserPreferences = async (prefs: Partial<UserPreferences>) => {
    try {
      // Önce state'i güncelle (UI için)
      setUserPreferences({ ...userPreferences, ...prefs })

      // Sonra API'ye gönder
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...userPreferences, ...prefs }),
      })

      if (!response.ok) {
        // Hata durumunda state'i geri al
        const originalPrefs = { ...userPreferences }
        setUserPreferences(originalPrefs)
        throw new Error("Tercihler güncellenemedi")
      }
    } catch (error) {
      console.error("Tercihler güncellenirken hata:", error)
      throw error
    }
  }

  const value = {
    user,
    pages,
    selectedPageId,
    userPreferences,
    favoriteTemplateIds,
    setSelectedPageId,
    updatePage,
    createPage,
    deletePage,
    toggleTemplateFavorite,
    updateUserPreferences,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}

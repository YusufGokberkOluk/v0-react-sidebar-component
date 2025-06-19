"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "./sidebar"
import Editor from "./editor"
import type { Page } from "@/lib/db-types"

interface AppLayoutProps {
  children?: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchPages = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/pages", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched pages:", data)

      if (data.success && Array.isArray(data.pages)) {
        setPages(data.pages)
      } else {
        setPages([])
      }
    } catch (error) {
      console.error("Error fetching pages:", error)
      setError("Sayfalar yüklenirken hata oluştu")
      setPages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPages()
  }, [])

  const handlePageSelect = (page: Page) => {
    setSelectedPage(page)
  }

  const handlePageCreate = async (title: string) => {
    try {
      const response = await fetch("/api/pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title, content: "" }),
      })

      if (!response.ok) {
        throw new Error("Failed to create page")
      }

      const data = await response.json()
      if (data.success) {
        await fetchPages()
        setSelectedPage(data.page)
      }
    } catch (error) {
      console.error("Error creating page:", error)
      setError("Sayfa oluşturulurken hata oluştu")
    }
  }

  const handlePageUpdate = async (pageId: string, updates: Partial<Page>) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update page")
      }

      const data = await response.json()
      if (data.success) {
        await fetchPages()
        setSelectedPage(data.page)
      }
    } catch (error) {
      console.error("Error updating page:", error)
      setError("Sayfa güncellenirken hata oluştu")
    }
  }

  const handlePageDelete = async (pageId: string) => {
    try {
      const response = await fetch(`/api/pages/${pageId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to delete page")
      }

      await fetchPages()
      if (selectedPage?._id === pageId) {
        setSelectedPage(null)
      }
    } catch (error) {
      console.error("Error deleting page:", error)
      setError("Sayfa silinirken hata oluştu")
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen bg-[#f8faf8] dark:bg-[#13262F]">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ABD1B5]"></div>
            <p className="text-[#13262F] dark:text-[#EDF4ED]">Sayfalar yükleniyor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen bg-[#f8faf8] dark:bg-[#13262F]">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-red-500 text-center">
              <p className="text-lg font-semibold">Hata!</p>
              <p>{error}</p>
              <button
                onClick={fetchPages}
                className="mt-4 px-4 py-2 bg-[#ABD1B5] text-[#13262F] rounded hover:bg-[#9BC4A4] transition-colors"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#f8faf8] dark:bg-[#13262F]">
      <Sidebar
        pages={pages}
        selectedPage={selectedPage}
        onPageSelect={handlePageSelect}
        onPageCreate={handlePageCreate}
        onPageDelete={handlePageDelete}
        onRefresh={fetchPages}
      />
      <div className="flex-1">
        {selectedPage ? (
          <Editor page={selectedPage} onUpdate={handlePageUpdate} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#13262F] dark:text-[#EDF4ED] mb-4">Hoş geldiniz!</h2>
              <p className="text-[#13262F]/70 dark:text-[#EDF4ED]/70 mb-6">
                Başlamak için sol taraftan bir sayfa seçin veya yeni bir sayfa oluşturun.
              </p>
              <button
                onClick={() => handlePageCreate("Yeni Sayfa")}
                className="px-6 py-3 bg-[#ABD1B5] text-[#13262F] rounded-lg hover:bg-[#9BC4A4] transition-colors font-medium"
              >
                İlk Sayfanızı Oluşturun
              </button>
            </div>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

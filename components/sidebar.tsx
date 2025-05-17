"use client"

import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { Star, LogOut, Plus, Trash2, Search, ChevronDown, Check, FolderPlus, LayoutList, Grid2x2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Page {
  _id: string
  title: string
  isFavorite: boolean
  content?: string
  tags?: string[]
}

interface SidebarProps {
  pages: Page[]
  selectedPageId?: string
  onNavigate?: (pageId: string) => void
  onToggleFavorite?: (pageId: string) => void
  onCreatePage?: () => void
  onDeletePage?: (pageId: string) => void
  isLoading?: boolean
}

type ViewMode = "list" | "grid"

export default function Sidebar({
  pages = [],
  selectedPageId,
  onNavigate,
  onToggleFavorite,
  onCreatePage,
  onDeletePage,
  isLoading = false,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilteringFavorites, setIsFilteringFavorites] = useState(false)
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState("My Workspace")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()

  // localStorage'dan görünüm modunu yükle
  useEffect(() => {
    const storedViewMode = localStorage.getItem("sidebarViewMode") as ViewMode | null
    if (storedViewMode && (storedViewMode === "list" || storedViewMode === "grid")) {
      setViewMode(storedViewMode)
    }
    setIsInitialized(true)
  }, [])

  // Görünüm modu değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("sidebarViewMode", viewMode)
    }
  }, [viewMode, isInitialized])

  // Örnek çalışma alanları
  const workspaces = ["My Workspace", "Project X", "Personal"]

  // Arama sorgusu ve favori filtresine göre sayfaları filtrele
  const filteredPages = useMemo(() => {
    return pages.filter((page) => {
      const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFavorite = isFilteringFavorites ? page.isFavorite : true
      return matchesSearch && matchesFavorite
    })
  }, [pages, searchQuery, isFilteringFavorites])

  const handleNavigate = (pageId: string) => {
    onNavigate?.(pageId)
  }

  const handleToggleFavorite = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation() // Gezinmeyi tetiklemesini önle
    onToggleFavorite?.(pageId)
  }

  const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation() // Gezinmeyi tetiklemesini önle

    // Kullanıcıdan onay al
    if (window.confirm("Bu sayfayı silmek istediğinizden emin misiniz?")) {
      onDeletePage?.(pageId)
    }
  }

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        // Ana sayfaya yönlendir
        router.push("/")
      } else {
        console.error("Logout failed")
      }
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const handleCreateNewPage = () => {
    onCreatePage?.()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
  }

  const handleToggleFavoritesFilter = () => {
    setIsFilteringFavorites(!isFilteringFavorites)
  }

  const toggleWorkspaceDropdown = () => {
    setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)
  }

  const handleSwitchWorkspace = (workspace: string) => {
    setCurrentWorkspace(workspace)
    setIsWorkspaceDropdownOpen(false)
  }

  const handleCreateWorkspace = () => {
    console.log("Open Create Workspace modal")
    setIsWorkspaceDropdownOpen(false)
  }

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode)
  }

  return (
    <div className="flex flex-col h-screen w-64 bg-[#13262F] text-[#EDF4ED] border-r border-[#79B791]/20">
      {/* Çalışma Alanı Seçici */}
      <div className="relative p-3 border-b border-[#79B791]/20">
        <button
          onClick={toggleWorkspaceDropdown}
          className="flex items-center justify-between w-full p-2 rounded-md hover:bg-[#79B791]/10 transition-all duration-200"
        >
          <div className="flex items-center">
            <div className="w-5 h-5 rounded bg-[#79B791] mr-2 flex items-center justify-center text-xs font-medium text-white">
              {currentWorkspace.charAt(0)}
            </div>
            <span className="font-medium truncate text-sm">{currentWorkspace}</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isWorkspaceDropdownOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isWorkspaceDropdownOpen && (
          <div className="absolute left-3 right-3 mt-1 z-10 bg-[#13262F] border border-[#79B791]/20 rounded-md shadow-lg overflow-hidden">
            <div className="py-1">
              <p className="px-3 py-1 text-xs text-[#EDF4ED]/50 font-medium">WORKSPACES</p>
              {workspaces.map((workspace) => (
                <button
                  key={workspace}
                  onClick={() => handleSwitchWorkspace(workspace)}
                  className="flex items-center w-full px-3 py-1.5 text-sm hover:bg-[#ABD1B5]/10 transition-all duration-200"
                >
                  <div className="w-5 h-5 rounded bg-[#79B791] mr-2 flex items-center justify-center text-xs font-medium text-white">
                    {workspace.charAt(0)}
                  </div>
                  <span>{workspace}</span>
                  {workspace === currentWorkspace && <Check className="h-4 w-4 ml-auto text-[#ABD1B5]" />}
                </button>
              ))}
            </div>
            <div className="border-t border-[#79B791]/20 py-1">
              <button
                onClick={handleCreateWorkspace}
                className="flex items-center w-full px-3 py-1.5 text-sm hover:bg-[#ABD1B5]/10 transition-all duration-200"
              >
                <FolderPlus className="h-4 w-4 mr-2 text-[#79B791]" />
                Create New Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Arama ve Favori Filtresi */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-[#EDF4ED]/40" />
          </div>
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full py-1.5 pl-9 pr-9 bg-[#13262F] text-[#EDF4ED] placeholder-[#EDF4ED]/40 border border-[#ABD1B5]/20 rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791]/50 text-sm"
            aria-label="Search pages"
          />
          <button
            onClick={handleToggleFavoritesFilter}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors ${
              isFilteringFavorites ? "text-[#ABD1B5]" : "text-[#EDF4ED]/40 hover:text-[#EDF4ED]/70"
            }`}
            aria-label={isFilteringFavorites ? "Show all pages" : "Show only favorites"}
            title={isFilteringFavorites ? "Show all pages" : "Show only favorites"}
          >
            <Star className={`h-3.5 w-3.5 ${isFilteringFavorites ? "fill-[#ABD1B5]" : ""}`} />
          </button>
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-[#EDF4ED]/70">Pages</h2>

          {/* Görünüm Modu Değiştirici */}
          <div className="flex rounded-md overflow-hidden border border-[#79B791]/20">
            <button
              onClick={() => handleSetViewMode("list")}
              className={`p-1 transition-colors ${
                viewMode === "list"
                  ? "bg-[#79B791]/30 text-[#EDF4ED]"
                  : "hover:bg-[#79B791]/10 text-[#EDF4ED]/70 hover:text-[#EDF4ED]"
              }`}
              aria-label="List View"
              title="List View"
              aria-pressed={viewMode === "list"}
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleSetViewMode("grid")}
              className={`p-1 transition-colors ${
                viewMode === "grid"
                  ? "bg-[#79B791]/30 text-[#EDF4ED]"
                  : "hover:bg-[#79B791]/10 text-[#EDF4ED]/70 hover:text-[#EDF4ED]"
              }`}
              aria-label="Grid View"
              title="Grid View"
              aria-pressed={viewMode === "grid"}
            >
              <Grid2x2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button
          onClick={handleCreateNewPage}
          className="flex items-center w-full p-1.5 mb-3 rounded-md bg-[#79B791]/20 text-[#EDF4ED] hover:bg-[#79B791]/30 transition-all duration-200 text-sm"
        >
          <Plus className="h-4 w-4 mr-1.5 text-[#79B791]" />
          New Page
        </button>

        {/* Yükleniyor Durumu */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#79B791] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Arama Sonuçları Durumu */}
            {searchQuery && (
              <div className="text-xs text-[#EDF4ED]/50 mb-2">
                {filteredPages.length === 0 ? (
                  <p>No results found</p>
                ) : (
                  <p>
                    Showing {filteredPages.length} {filteredPages.length === 1 ? "result" : "results"}
                    {isFilteringFavorites ? " in favorites" : ""}
                  </p>
                )}
              </div>
            )}

            {/* Boş Durum */}
            {filteredPages.length === 0 && (
              <div className="py-8 px-4 text-center">
                <Search className="h-10 w-10 text-[#EDF4ED]/20 mx-auto mb-2" />
                <p className="text-sm text-[#EDF4ED]/60">
                  {searchQuery
                    ? `No results found for "${searchQuery}"`
                    : isFilteringFavorites
                      ? "You don't have any favorites yet"
                      : "No pages found"}
                </p>
                {isFilteringFavorites && (
                  <button
                    onClick={() => setIsFilteringFavorites(false)}
                    className="mt-2 text-xs text-[#79B791] hover:text-[#ABD1B5]"
                  >
                    Show all pages
                  </button>
                )}
                <button
                  onClick={handleCreateNewPage}
                  className="mt-4 flex items-center justify-center mx-auto px-3 py-1.5 rounded-md bg-[#79B791]/20 text-[#EDF4ED] hover:bg-[#79B791]/30 transition-all duration-200 text-sm"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create new page
                </button>
              </div>
            )}

            {/* Liste veya Grid Görünümü */}
            {viewMode === "list" ? (
              <ul className="space-y-0.5">
                {filteredPages.map((page) => (
                  <li
                    key={page._id}
                    onClick={() => handleNavigate(page._id)}
                    className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition-all duration-200 ${
                      selectedPageId === page._id
                        ? "bg-[#79B791]/30 text-[#EDF4ED]"
                        : "hover:bg-[#79B791]/10 text-[#EDF4ED]/90"
                    }`}
                  >
                    <span className="truncate text-sm">{page.title}</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleDeletePage(e, page._id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-opacity duration-200 p-0.5 rounded hover:bg-[#79B791]/20"
                        aria-label={`Delete ${page.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400 hover:text-red-300" />
                      </button>
                      <button
                        onClick={(e) => handleToggleFavorite(e, page._id)}
                        className="focus:outline-none p-0.5 rounded hover:bg-[#79B791]/20"
                        aria-label={page.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${page.isFavorite ? "fill-[#ABD1B5] text-[#ABD1B5]" : "text-[#EDF4ED]/40"}`}
                        />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredPages.map((page) => (
                  <div
                    key={page._id}
                    onClick={() => handleNavigate(page._id)}
                    className={`group flex flex-col p-3 rounded-md cursor-pointer transition-all duration-200 h-24 relative ${
                      selectedPageId === page._id
                        ? "bg-[#79B791]/30 text-[#EDF4ED]"
                        : "hover:bg-[#79B791]/10 text-[#EDF4ED]/90"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-medium truncate mb-1 pr-6">{page.title}</h3>
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button
                          onClick={(e) => handleToggleFavorite(e, page._id)}
                          className="focus:outline-none p-0.5 rounded hover:bg-[#79B791]/20"
                          aria-label={page.isFavorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star
                            className={`h-3.5 w-3.5 ${page.isFavorite ? "fill-[#ABD1B5] text-[#ABD1B5]" : "text-[#EDF4ED]/40"}`}
                          />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#EDF4ED]/60 line-clamp-2 flex-grow">
                      {page.content ? page.content.substring(0, 60) + "..." : "No content"}
                    </p>
                    <div className="mt-auto flex justify-between items-center">
                      <span className="text-xs text-[#EDF4ED]/40">
                        {page.tags && page.tags.length > 0 ? page.tags[0] : "No tags"}
                      </span>
                      <button
                        onClick={(e) => handleDeletePage(e, page._id)}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none transition-opacity duration-200 p-0.5 rounded hover:bg-[#79B791]/20"
                        aria-label={`Delete ${page.title}`}
                      >
                        <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-3 border-t border-[#79B791]/20">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full p-1.5 rounded-md border border-[#79B791]/30 text-[#EDF4ED]/90 hover:bg-[#79B791]/10 transition-all duration-200 text-sm"
        >
          <LogOut className="h-3.5 w-3.5 mr-1.5" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

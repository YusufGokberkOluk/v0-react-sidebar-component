"use client"

import type React from "react"
import { useState, useMemo, useEffect, useRef } from "react"
import {
  Star,
  LogOut,
  Plus,
  Trash2,
  Search,
  ChevronDown,
  Check,
  FolderPlus,
  LayoutList,
  Grid2x2,
  Tag,
  X,
} from "lucide-react"
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
type SearchMode = "title" | "tag"

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
  const [tagSearchQuery, setTagSearchQuery] = useState("")
  const [isFilteringFavorites, setIsFilteringFavorites] = useState(false)
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false)
  const [currentWorkspace, setCurrentWorkspace] = useState("My Workspace")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [isInitialized, setIsInitialized] = useState(false)
  const [searchMode, setSearchMode] = useState<SearchMode>("title")
  const [searchResults, setSearchResults] = useState<Page[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [filteredTags, setFilteredTags] = useState<string[]>([])
  const tagInputRef = useRef<HTMLInputElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)
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

  // fetchTags fonksiyonunu bileşen dışından içine taşıyalım
  const fetchTags = async () => {
    setIsLoadingTags(true)
    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailableTags(data.tags)
          setFilteredTags(data.tags)
        }
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    } finally {
      setIsLoadingTags(false)
    }
  }

  // Tüm tag'leri getir
  useEffect(() => {
    fetchTags()
  }, []) // fetchTags fonksiyonunu dependency array'e eklemeyin, çünkü içeride tanımladık

  // Tag dropdown açıldığında tag'leri yeniden getir
  useEffect(() => {
    if (isTagDropdownOpen) {
      fetchTags()
    }
  }, [isTagDropdownOpen])

  // Yeni tag eklendiğinde tag'leri yeniden getir
  useEffect(() => {
    const handleTagAdded = () => {
      fetchTags()
    }

    // Event listener'ı ekle
    window.addEventListener("tagAdded", handleTagAdded as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener("tagAdded", handleTagAdded as EventListener)
    }
  }, [])

  // Tag input değiştiğinde filtreleme yap
  useEffect(() => {
    if (tagSearchQuery.trim() === "") {
      setFilteredTags(availableTags)
    } else {
      const filtered = availableTags.filter((tag) => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
      setFilteredTags(filtered)
    }
  }, [tagSearchQuery, availableTags])

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Sidebar bileşeninde, useEffect içinde event listener ekleyelim
  useEffect(() => {
    const handleSearchByTagEvent = (event: CustomEvent<{ tag: string }>) => {
      const { tag } = event.detail
      setSearchMode("tag")
      setTagSearchQuery(tag)
      searchByTag(tag)
    }

    // Event listener'ı ekle
    window.addEventListener("searchByTag", handleSearchByTagEvent as EventListener)

    // Cleanup
    return () => {
      window.removeEventListener("searchByTag", handleSearchByTagEvent as EventListener)
    }
  }, [])

  // Örnek çalışma alanları
  const workspaces = ["My Workspace", "Project X", "Personal"]

  // Tag ile arama yapma fonksiyonu
  const searchByTag = async (tag: string) => {
    if (!tag.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/pages/search-by-tag?tag=${encodeURIComponent(tag.trim())}`)

      if (!response.ok) {
        throw new Error("Tag ile arama yapılırken bir hata oluştu")
      }

      const data = await response.json()
      if (data.success) {
        setSearchResults(data.pages)
      } else {
        console.error("Tag ile arama hatası:", data.message)
        setSearchResults([])
      }
    } catch (error) {
      console.error("Tag ile arama hatası:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Tag arama sorgusu değiştiğinde arama yap
  useEffect(() => {
    if (searchMode === "tag" && tagSearchQuery.trim()) {
      const delayDebounceFn = setTimeout(() => {
        searchByTag(tagSearchQuery)
      }, 300)

      return () => clearTimeout(delayDebounceFn)
    }
  }, [tagSearchQuery, searchMode])

  // Arama sorgusu ve favori filtresine göre sayfaları filtrele
  const filteredPages = useMemo(() => {
    // Tag araması yapılıyorsa ve sonuçlar varsa, onları göster
    if (searchMode === "tag" && tagSearchQuery.trim() !== "") {
      return searchResults.filter((page) => {
        const matchesFavorite = isFilteringFavorites ? page.isFavorite : true
        return matchesFavorite
      })
    }

    // Normal başlık araması
    return pages.filter((page) => {
      const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFavorite = isFilteringFavorites ? page.isFavorite : true
      return matchesSearch && matchesFavorite
    })
  }, [pages, searchQuery, isFilteringFavorites, searchMode, tagSearchQuery, searchResults])

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

  const handleTagSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setTagSearchQuery(query)
    setIsTagDropdownOpen(true)
  }

  // handleTagInputFocus fonksiyonunu güncelleyelim
  const handleTagInputFocus = () => {
    setIsTagDropdownOpen(true)
  }

  const handleSelectTag = (tag: string) => {
    setTagSearchQuery(tag)
    setIsTagDropdownOpen(false)
    searchByTag(tag)
  }

  const handleClearTagSearch = () => {
    setTagSearchQuery("")
    setSearchResults([])
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagSearchQuery.trim()) {
      e.preventDefault()
      searchByTag(tagSearchQuery)
      setIsTagDropdownOpen(false)
    } else if (e.key === "Escape") {
      setIsTagDropdownOpen(false)
    } else if (e.key === "ArrowDown" && isTagDropdownOpen && filteredTags.length > 0) {
      e.preventDefault()
      const firstOption = document.querySelector("[data-sidebar-tag-option]") as HTMLElement
      if (firstOption) {
        firstOption.focus()
      }
    }
  }

  const handleOptionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, tag: string, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleSelectTag(tag)
    } else if (e.key === "Escape") {
      e.preventDefault()
      setIsTagDropdownOpen(false)
      tagInputRef.current?.focus()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      const nextOption = document.querySelector(`[data-sidebar-tag-index="${index + 1}"]`) as HTMLElement
      if (nextOption) {
        nextOption.focus()
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (index === 0) {
        tagInputRef.current?.focus()
      } else {
        const prevOption = document.querySelector(`[data-sidebar-tag-index="${index - 1}"]`) as HTMLElement
        if (prevOption) {
          prevOption.focus()
        }
      }
    }
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

  const handleSetSearchMode = (mode: SearchMode) => {
    setSearchMode(mode)
    // Arama modunu değiştirdiğimizde arama sorgularını temizle
    if (mode === "title") {
      setTagSearchQuery("")
      setSearchResults([])
    } else {
      setSearchQuery("")
    }
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
        {/* Arama Modu Seçici */}
        <div className="flex mb-2 border border-[#ABD1B5]/20 rounded-md overflow-hidden">
          <button
            onClick={() => handleSetSearchMode("title")}
            className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center ${
              searchMode === "title" ? "bg-[#79B791]/30 text-[#EDF4ED]" : "text-[#EDF4ED]/70 hover:bg-[#79B791]/10"
            }`}
          >
            <Search className="h-3 w-3 mr-1" />
            Search Pages
          </button>
          <button
            onClick={() => handleSetSearchMode("tag")}
            className={`flex-1 py-1.5 text-xs font-medium flex items-center justify-center ${
              searchMode === "tag" ? "bg-[#79B791]/30 text-[#EDF4ED]" : "text-[#EDF4ED]/70 hover:bg-[#79B791]/10"
            }`}
          >
            <Tag className="h-3 w-3 mr-1" />
            Search by Tag
          </button>
        </div>

        {/* Arama ve Favori Filtresi */}
        <div className="relative mb-4">
          {searchMode === "title" ? (
            <>
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
            </>
          ) : (
            <div className="relative" ref={tagDropdownRef}>
              <div className="flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Tag className="h-3.5 w-3.5 text-[#EDF4ED]/40" />
                </div>
                <input
                  ref={tagInputRef}
                  type="text"
                  placeholder="Search by tag..."
                  value={tagSearchQuery}
                  onChange={handleTagSearchChange}
                  onFocus={handleTagInputFocus}
                  onKeyDown={handleTagKeyDown}
                  className="w-full py-1.5 pl-9 pr-16 bg-[#13262F] text-[#EDF4ED] placeholder-[#EDF4ED]/40 border border-[#ABD1B5]/20 rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791]/50 text-sm"
                  aria-label="Search by tag"
                  aria-expanded={isTagDropdownOpen}
                  aria-haspopup="listbox"
                  aria-controls="sidebar-tag-options"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
                  {tagSearchQuery && (
                    <button
                      onClick={handleClearTagSearch}
                      className="p-0.5 rounded-full hover:bg-[#79B791]/20 text-[#EDF4ED]/40 hover:text-[#EDF4ED]/70"
                      aria-label="Clear search"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {/* Dropdown açma/kapama butonunu güncelleyelim (yaklaşık 450. satır civarında) */}
                  <button
                    onClick={() => {
                      setIsTagDropdownOpen(!isTagDropdownOpen)
                      if (!isTagDropdownOpen) {
                        fetchTags() // Dropdown açılırken tag'leri yenile
                      }
                    }}
                    className="p-0.5 rounded-full hover:bg-[#79B791]/20 text-[#EDF4ED]/40 hover:text-[#EDF4ED]/70"
                    aria-label="Show tag options"
                  >
                    <ChevronDown className={`h-3 w-3 transition-transform ${isTagDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isSearching && (
                    <div className="h-3 w-3 border-2 border-[#79B791] border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
              </div>

              {isTagDropdownOpen && (
                <div
                  id="sidebar-tag-options"
                  className="absolute z-10 mt-1 w-full bg-[#13262F] rounded-md shadow-lg max-h-60 overflow-auto border border-[#79B791]/20"
                  role="listbox"
                >
                  {isLoadingTags ? (
                    <div className="p-2 text-center text-[#EDF4ED]/60 text-xs">
                      <div className="inline-block h-3 w-3 border-2 border-[#79B791] border-t-transparent rounded-full animate-spin mr-1"></div>
                      Loading tags...
                    </div>
                  ) : filteredTags.length === 0 ? (
                    <div className="p-2 text-center text-[#EDF4ED]/60 text-xs">No tags found</div>
                  ) : (
                    filteredTags.map((tag, index) => (
                      <button
                        key={tag}
                        onClick={() => handleSelectTag(tag)}
                        onKeyDown={(e) => handleOptionKeyDown(e, tag, index)}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#79B791]/20 focus:bg-[#79B791]/20 focus:outline-none"
                        role="option"
                        data-sidebar-tag-option
                        data-sidebar-tag-index={index}
                        tabIndex={-1}
                      >
                        {tag}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
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
            {(searchQuery || (searchMode === "tag" && tagSearchQuery)) && (
              <div className="text-xs text-[#EDF4ED]/50 mb-2">
                {filteredPages.length === 0 ? (
                  <p>No results found</p>
                ) : (
                  <p>
                    Showing {filteredPages.length} {filteredPages.length === 1 ? "result" : "results"}
                    {isFilteringFavorites ? " in favorites" : ""}
                    {searchMode === "tag" && tagSearchQuery ? ` for tag "${tagSearchQuery}"` : ""}
                  </p>
                )}
              </div>
            )}

            {/* Boş Durum */}
            {filteredPages.length === 0 && (
              <div className="py-8 px-4 text-center">
                {searchMode === "tag" && tagSearchQuery ? (
                  <>
                    <Tag className="h-10 w-10 text-[#EDF4ED]/20 mx-auto mb-2" />
                    <p className="text-sm text-[#EDF4ED]/60">No pages found with tag "{tagSearchQuery}"</p>
                  </>
                ) : searchQuery ? (
                  <>
                    <Search className="h-10 w-10 text-[#EDF4ED]/20 mx-auto mb-2" />
                    <p className="text-sm text-[#EDF4ED]/60">No results found for "{searchQuery}"</p>
                  </>
                ) : isFilteringFavorites ? (
                  <>
                    <Star className="h-10 w-10 text-[#EDF4ED]/20 mx-auto mb-2" />
                    <p className="text-sm text-[#EDF4ED]/60">You don't have any favorites yet</p>
                    <button
                      onClick={() => setIsFilteringFavorites(false)}
                      className="mt-2 text-xs text-[#79B791] hover:text-[#ABD1B5]"
                    >
                      Show all pages
                    </button>
                  </>
                ) : (
                  <>
                    <Search className="h-10 w-10 text-[#EDF4ED]/20 mx-auto mb-2" />
                    <p className="text-sm text-[#EDF4ED]/60">No pages found</p>
                  </>
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

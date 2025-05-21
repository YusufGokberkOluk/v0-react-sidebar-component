"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Plus, Search, Star, File, Folder, MoreHorizontal } from "lucide-react"
import Link from "next/link"

interface Page {
  _id: string
  title: string
  content: string
  tags: string[]
  isFavorite: boolean
  userId: string
  workspaceId: string
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

interface SidebarProps {
  pages?: Page[]
  selectedPageId?: string
  workspaces?: Workspace[]
  selectedWorkspaceId?: string
  onNavigate?: (pageId: string) => void
  onToggleFavorite?: (pageId: string) => void
  onCreatePage?: () => void
  onDeletePage?: (pageId: string) => void
  onSelectWorkspace?: (workspaceId: string) => void
  onCreateWorkspace?: () => void
  isLoading?: boolean
}

export default function Sidebar({
  pages = [],
  selectedPageId = "",
  workspaces = [],
  selectedWorkspaceId = "",
  onNavigate = () => {},
  onToggleFavorite = () => {},
  onCreatePage = () => {},
  onDeletePage = () => {},
  onSelectWorkspace = () => {},
  onCreateWorkspace = () => {},
  isLoading = false,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false)
  const [favorites, setFavorites] = useState<Page[]>([])
  const [otherPages, setOtherPages] = useState<Page[]>([])

  // Sayfaları favorilere ve diğerlerine ayır
  useEffect(() => {
    if (pages.length > 0) {
      setFavorites(pages.filter((page) => page.isFavorite))
      setOtherPages(pages.filter((page) => !page.isFavorite))
    } else {
      setFavorites([])
      setOtherPages([])
    }
  }, [pages])

  // Arama filtrelemesi
  const filteredFavorites = favorites.filter((page) => page.title.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredOtherPages = otherPages.filter((page) => page.title.toLowerCase().includes(searchQuery.toLowerCase()))

  // Seçili workspace'i bul
  const selectedWorkspace = workspaces.find((workspace) => workspace._id === selectedWorkspaceId)

  return (
    <div className="w-full h-full flex flex-col bg-[#13262F] text-white">
      {/* Workspace Dropdown */}
      <div className="p-4 border-b border-[#79B791]/20">
        <div className="relative">
          <button
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className="flex items-center justify-between w-full p-2 bg-[#1A3540] hover:bg-[#1F3F4C] rounded-md transition-colors"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-md bg-[#79B791] flex items-center justify-center text-white font-semibold mr-2">
                {selectedWorkspace ? selectedWorkspace.name.charAt(0) : "W"}
              </div>
              <span className="font-medium truncate">
                {selectedWorkspace ? selectedWorkspace.name : "Select Workspace"}
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-white/70 transition-transform ${isWorkspaceDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isWorkspaceDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-[#1A3540] rounded-md shadow-lg py-1 border border-[#79B791]/20">
              {workspaces.map((workspace) => (
                <button
                  key={workspace._id}
                  onClick={() => {
                    onSelectWorkspace(workspace._id)
                    setIsWorkspaceDropdownOpen(false)
                  }}
                  className={`flex items-center w-full px-3 py-2 text-sm text-left hover:bg-[#1F3F4C] transition-colors ${
                    workspace._id === selectedWorkspaceId ? "bg-[#1F3F4C]" : ""
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-[#79B791] flex items-center justify-center text-white font-semibold mr-2">
                    {workspace.name.charAt(0)}
                  </div>
                  <span className="truncate">{workspace.name}</span>
                </button>
              ))}
              <div className="border-t border-[#79B791]/20 mt-1 pt-1">
                <button
                  onClick={() => {
                    onCreateWorkspace()
                    setIsWorkspaceDropdownOpen(false)
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-left text-[#79B791] hover:bg-[#1F3F4C] transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white/50" />
          </div>
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-1.5 pl-10 pr-4 bg-[#1A3540] border border-[#79B791]/20 rounded-md focus:outline-none focus:ring-1 focus:ring-[#79B791] text-white text-sm placeholder-white/50"
          />
        </div>
      </div>

      {/* Create Page Button */}
      <div className="px-4 pb-3">
        <button
          onClick={onCreatePage}
          disabled={!selectedWorkspaceId || isLoading}
          className="flex items-center justify-center w-full px-3 py-1.5 bg-[#79B791] text-white rounded-md hover:bg-[#ABD1B5] transition-colors disabled:opacity-50 disabled:hover:bg-[#79B791]"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">New Page</span>
        </button>
      </div>

      {/* Pages List */}
      <div className="flex-1 overflow-y-auto px-2">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-[#79B791] border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-white/70">Loading...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
            <Folder className="h-8 w-8 text-white/30 mb-2" />
            <p className="text-sm text-white/70">
              {selectedWorkspaceId
                ? "No pages in this workspace yet. Create your first page!"
                : "Select a workspace to see pages"}
            </p>
          </div>
        ) : (
          <>
            {/* Favorites Section */}
            {filteredFavorites.length > 0 && (
              <div className="mb-4">
                <h3 className="px-3 py-2 text-xs font-medium text-white/50 uppercase tracking-wider">Favorites</h3>
                <ul>
                  {filteredFavorites.map((page) => (
                    <li key={page._id}>
                      <div
                        onClick={() => onNavigate(page._id)}
                        className={`flex items-center px-3 py-2 rounded-md cursor-pointer group ${
                          selectedPageId === page._id ? "bg-[#1F3F4C]" : "hover:bg-[#1A3540]"
                        }`}
                      >
                        <File className="h-4 w-4 text-white/70 mr-2 flex-shrink-0" />
                        <span className="text-sm text-white truncate flex-1">{page.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleFavorite(page._id)
                          }}
                          className="p-1 rounded-full hover:bg-[#1A3540] text-[#79B791] opacity-80 hover:opacity-100"
                          aria-label={`Remove ${page.title} from favorites`}
                        >
                          <Star className="h-3.5 w-3.5 fill-[#79B791]" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Other Pages Section */}
            {filteredOtherPages.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-medium text-white/50 uppercase tracking-wider">All Pages</h3>
                <ul>
                  {filteredOtherPages.map((page) => (
                    <li key={page._id}>
                      <div
                        onClick={() => onNavigate(page._id)}
                        className={`flex items-center px-3 py-2 rounded-md cursor-pointer group ${
                          selectedPageId === page._id ? "bg-[#1F3F4C]" : "hover:bg-[#1A3540]"
                        }`}
                      >
                        <File className="h-4 w-4 text-white/70 mr-2 flex-shrink-0" />
                        <span className="text-sm text-white truncate flex-1">{page.title}</span>
                        <div className="flex items-center opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleFavorite(page._id)
                            }}
                            className="p-1 rounded-full hover:bg-[#1A3540] text-white/70 hover:text-[#79B791]"
                            aria-label={`Add ${page.title} to favorites`}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`Are you sure you want to delete "${page.title}"?`)) {
                                onDeletePage(page._id)
                              }
                            }}
                            className="p-1 rounded-full hover:bg-[#1A3540] text-white/70 hover:text-red-400"
                            aria-label={`Delete ${page.title}`}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* No Results */}
            {filteredFavorites.length === 0 && filteredOtherPages.length === 0 && searchQuery && (
              <div className="flex flex-col items-center justify-center h-32 px-4 text-center">
                <Search className="h-6 w-6 text-white/30 mb-2" />
                <p className="text-sm text-white/70">No pages found matching "{searchQuery}"</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Links */}
      <div className="mt-auto border-t border-[#79B791]/20 p-2">
        <Link
          href="/settings"
          className="flex items-center px-3 py-2 text-sm text-white/80 hover:bg-[#1A3540] rounded-md transition-colors"
        >
          Settings
        </Link>
      </div>
    </div>
  )
}

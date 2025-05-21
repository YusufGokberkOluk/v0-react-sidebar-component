"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  AlignLeft,
  Plus,
  X,
  Check,
  AlertCircle,
  ImagePlus,
  Undo,
  Redo,
  Share2,
  Sparkles,
  ListOrdered,
  ListChecks,
  Link,
  Code,
  Keyboard,
  ChevronDown,
} from "lucide-react"
import ShareModal from "./share-modal"
import AiActionsPopup from "./ai-actions-popup"

// Create a simple Tooltip component at the top of the file
function Tooltip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[#13262F] text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {label}
      </div>
    </div>
  )
}

type SaveStatus = "idle" | "saving" | "saved" | "error"

interface EditorProps {
  title: string
  pageId: string
  initialContent?: string
  initialTags?: string[]
  saveStatus?: SaveStatus
  onChange?: (content: string) => void
  onTagsChange?: (tags: string[]) => void
  onTitleChange?: (title: string) => void
  loading?: boolean
}

export default function Editor({
  title,
  pageId,
  initialContent = "",
  initialTags = [],
  saveStatus = "idle",
  onChange,
  onTagsChange,
  onTitleChange,
  loading = false,
}: EditorProps) {
  const [content, setContent] = useState(initialContent)
  const [pageTitle, setPageTitle] = useState(title)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [newTag, setNewTag] = useState("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isAiActionsOpen, setIsAiActionsOpen] = useState(false)
  const [aiPosition, setAiPosition] = useState<{ top: number; left: number } | null>(null)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false)
  const [filteredTags, setFilteredTags] = useState<string[]>([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const tagDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  useEffect(() => {
    setTags(initialTags)
  }, [initialTags])

  useEffect(() => {
    setPageTitle(title)
  }, [title])

  // Tüm tag'leri getir
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoadingTags(true)
      try {
        const response = await fetch("/api/tags")
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setAvailableTags(data.tags)
          }
        }
      } catch (error) {
        console.error("Error fetching tags:", error)
      } finally {
        setIsLoadingTags(false)
      }
    }

    fetchTags()
  }, [])

  // Tag input değiştiğinde filtreleme yap
  useEffect(() => {
    if (newTag.trim() === "") {
      setFilteredTags(availableTags)
    } else {
      const filtered = availableTags.filter(
        (tag) => tag.toLowerCase().includes(newTag.toLowerCase()) && !tags.includes(tag),
      )
      setFilteredTags(filtered)
    }
  }, [newTag, availableTags, tags])

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

  // Handle save status changes
  useEffect(() => {
    if (saveStatus === "saved") {
      setHasUnsavedChanges(false)
      setShowSaved(true)
      const timer = setTimeout(() => {
        setShowSaved(false)
      }, 2000) // Hide "Saved" message after 2 seconds
      return () => clearTimeout(timer)
    }
  }, [saveStatus])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setHasUnsavedChanges(true)
    onChange?.(newContent)
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setPageTitle(newTitle)
    setHasUnsavedChanges(true)
    onTitleChange?.(newTitle)
  }

  const handleTitleBlur = () => {
    if (pageTitle.trim() === "") {
      setPageTitle("Untitled")
      onTitleChange?.("Untitled")
    }
  }

  const handleUndo = () => {
    console.log("Undo action")
  }

  const handleRedo = () => {
    console.log("Redo action")
  }

  const handleBold = () => {
    console.log("Apply Bold style")
  }

  const handleItalic = () => {
    console.log("Apply Italic style")
  }

  const handleH1 = () => {
    console.log("Apply H1 style")
  }

  const handleH2 = () => {
    console.log("Apply H2 style")
  }

  const handleParagraph = () => {
    console.log("Apply Paragraph style")
  }

  const handleAddImage = () => {
    console.log("Open image uploader")
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      setNewTag("")
      setHasUnsavedChanges(true)
      console.log("Add tag:", newTag.trim())
      onTagsChange?.(updatedTags)

      // Yeni tag'i mevcut tag'lere ekle (eğer henüz yoksa)
      if (!availableTags.includes(newTag.trim())) {
        setAvailableTags([...availableTags, newTag.trim()].sort())

        // Yeni tag eklendiğinde bir event yayınla
        const tagAddedEvent = new CustomEvent("tagAdded", {
          detail: { tag: newTag.trim() },
        })
        window.dispatchEvent(tagAddedEvent)
      }
    }
    setIsTagDropdownOpen(false)
  }

  const handleSelectTag = (tag: string) => {
    if (!tags.includes(tag)) {
      const updatedTags = [...tags, tag]
      setTags(updatedTags)
      setNewTag("")
      setHasUnsavedChanges(true)
      console.log("Selected tag:", tag)
      onTagsChange?.(updatedTags)
    }
    setIsTagDropdownOpen(false)
  }

  const handleTagClick = (tag: string) => {
    console.log("Filter by tag:", tag)
    // Sidebar'daki tag aramasını tetiklemek için bir özel event yayınlayalım
    const searchByTagEvent = new CustomEvent("searchByTag", { detail: { tag } })
    window.dispatchEvent(searchByTagEvent)
  }

  const handleRemoveTag = (e: React.MouseEvent, tagToRemove: string) => {
    e.stopPropagation() // Prevent triggering the tag click
    const updatedTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(updatedTags)
    setHasUnsavedChanges(true)
    console.log("Remove tag:", tagToRemove)
    onTagsChange?.(updatedTags)
  }

  const handleTagInputFocus = () => {
    setIsTagDropdownOpen(true)
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value)
    setIsTagDropdownOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === "Escape") {
      setIsTagDropdownOpen(false)
    } else if (e.key === "ArrowDown" && isTagDropdownOpen && filteredTags.length > 0) {
      e.preventDefault()
      const firstOption = document.querySelector("[data-tag-option]") as HTMLElement
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
      const nextOption = document.querySelector(`[data-tag-index="${index + 1}"]`) as HTMLElement
      if (nextOption) {
        nextOption.focus()
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (index === 0) {
        tagInputRef.current?.focus()
      } else {
        const prevOption = document.querySelector(`[data-tag-index="${index - 1}"]`) as HTMLElement
        if (prevOption) {
          prevOption.focus()
        }
      }
    }
  }

  const handleShare = () => {
    console.log("Open Share Modal for page:", pageId)
    setIsShareModalOpen(true)
  }

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false)
  }

  const handleOpenAiActions = (e: React.MouseEvent) => {
    console.log("Open AI Actions for page:", pageId)
    // Get the position of the button to position the popup
    const button = e.currentTarget as HTMLButtonElement
    const rect = button.getBoundingClientRect()
    setAiPosition({ top: rect.bottom + 5, left: rect.left })
    setIsAiActionsOpen(true)
  }

  const handleCloseAiActions = () => {
    setIsAiActionsOpen(false)
    setAiPosition(null)
  }

  // Render save status indicator
  const renderSaveStatus = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center text-blue-400 text-xs">
            <span className="animate-pulse">Saving...</span>
          </div>
        )
      case "saved":
        return showSaved ? (
          <div className="flex items-center text-[#79B791] text-xs">
            <Check className="h-3.5 w-3.5 mr-1" />
            <span>Saved</span>
          </div>
        ) : null
      case "error":
        return (
          <div className="flex items-center text-red-400 text-xs">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            <span>Error saving</span>
          </div>
        )
      case "idle":
        return hasUnsavedChanges ? (
          <div className="flex items-center text-[#13262F]/50 text-xs">
            <span>Unsaved changes</span>
          </div>
        ) : null
      default:
        return null
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts with modifier keys
      if (!(e.ctrlKey || e.metaKey)) return

      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault()
          handleBold()
          break
        case "i":
          e.preventDefault()
          handleItalic()
          break
        case "s":
          e.preventDefault()
          // Save action
          onChange?.(content)
          break
        case "/":
          e.preventDefault()
          // Show command palette (could be implemented later)
          console.log("Command palette requested")
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [content, onChange])

  // Add this inside the Editor component
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = "You have unsaved changes. Are you sure you want to leave?"
        e.returnValue = message
        return message
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  return (
    <div className="h-full w-full flex flex-col">
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[#79B791] border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-sm text-[#13262F]/70">Loading document...</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ABD1B5]/20 max-w-4xl mx-auto w-full">
        <input
          type="text"
          value={pageTitle}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          className="text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#79B791]/30 rounded px-1 -ml-1 w-full"
          placeholder="Untitled"
        />
        <div className="flex items-center space-x-3">
          <div className="text-sm font-medium">{renderSaveStatus()}</div>
          {saveStatus === "error" && (
            <div id="save-error" className="sr-only">
              There was an error saving your changes. Please try again.
            </div>
          )}
          <button
            onClick={handleShare}
            className="flex items-center px-2.5 py-1 bg-[#79B791]/10 text-[#79B791] rounded-md hover:bg-[#79B791]/20 transition-colors"
          >
            <Share2 className="h-3.5 w-3.5 mr-1.5" />
            <span className="text-sm">Share</span>
          </button>
        </div>
      </div>

      {/* Tags Section */}
      <div className="px-4 py-2 border-b border-[#ABD1B5]/20 max-w-4xl mx-auto w-full">
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <div
              key={tag}
              onClick={() => handleTagClick(tag)}
              className="flex items-center bg-[#EDF4ED] text-[#13262F] text-xs px-2 py-1 rounded-full cursor-pointer hover:bg-[#ABD1B5]/20 transition-colors"
            >
              <span>{tag}</span>
              <button
                onClick={(e) => handleRemoveTag(e, tag)}
                className="ml-1 rounded-full hover:bg-[#13262F]/10 p-0.5"
                aria-label={`Remove ${tag} tag`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="relative" ref={tagDropdownRef}>
            <div className="flex items-center">
              <input
                ref={tagInputRef}
                type="text"
                value={newTag}
                onChange={handleTagInputChange}
                onFocus={handleTagInputFocus}
                onKeyDown={handleKeyDown}
                placeholder="Add tag..."
                className="bg-transparent text-[#13262F] text-xs px-2 py-1 border border-transparent focus:border-[#ABD1B5]/30 rounded-md focus:outline-none focus:ring-0 w-24 sm:w-32"
                aria-expanded={isTagDropdownOpen}
                aria-haspopup="listbox"
                aria-controls="tag-options"
              />
              <button
                onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                className="p-1 text-[#13262F]/60 hover:text-[#13262F] focus:outline-none"
                aria-label="Show tag options"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${isTagDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim()}
                className="flex items-center justify-center text-[#79B791] p-1 rounded-md hover:bg-[#79B791]/10 disabled:opacity-50 disabled:hover:bg-transparent"
                aria-label="Add tag"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {isTagDropdownOpen && (
              <div
                id="tag-options"
                className="absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg max-h-60 overflow-auto border border-[#ABD1B5]/20"
                role="listbox"
              >
                {isLoadingTags ? (
                  <div className="p-2 text-center text-[#13262F]/60 text-xs">
                    <div className="inline-block h-3 w-3 border-2 border-[#79B791] border-t-transparent rounded-full animate-spin mr-1"></div>
                    Loading tags...
                  </div>
                ) : filteredTags.length === 0 ? (
                  <div className="p-2 text-center text-[#13262F]/60 text-xs">
                    {newTag.trim() ? "No matching tags found" : "No tags available"}
                  </div>
                ) : (
                  filteredTags.map((tag, index) => (
                    <button
                      key={tag}
                      onClick={() => handleSelectTag(tag)}
                      onKeyDown={(e) => handleOptionKeyDown(e, tag, index)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#EDF4ED] focus:bg-[#EDF4ED] focus:outline-none"
                      role="option"
                      data-tag-option
                      data-tag-index={index}
                      tabIndex={-1}
                    >
                      {tag}
                    </button>
                  ))
                )}
                {newTag.trim() && !availableTags.includes(newTag.trim()) && !tags.includes(newTag.trim()) && (
                  <button
                    onClick={handleAddTag}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#79B791] hover:bg-[#EDF4ED] focus:bg-[#EDF4ED] focus:outline-none border-t border-[#ABD1B5]/10"
                    role="option"
                  >
                    Create "{newTag.trim()}"
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center px-4 py-1.5 border-b border-[#ABD1B5]/20 max-w-4xl mx-auto w-full">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
          {/* Undo/Redo Buttons */}
          <button
            onClick={handleUndo}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group"
            aria-label="Undo"
            title="Undo"
          >
            <Undo className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>
          <button
            onClick={handleRedo}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group"
            aria-label="Redo"
            title="Redo"
          >
            <Redo className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>

          <div className="h-5 w-px bg-[#ABD1B5]/30 mx-1"></div>

          {/* Text Formatting Buttons */}
          <Tooltip label="Bold (Ctrl+B)">
            <button
              onClick={handleBold}
              className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors"
              aria-label="Bold"
            >
              <Bold className="h-4 w-4 text-[#13262F]/70" />
            </button>
          </Tooltip>
          <Tooltip label="Italic (Ctrl+I)">
            <button
              onClick={handleItalic}
              className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group"
              aria-label="Italic"
              title="Italic"
            >
              <Italic className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
            </button>
          </Tooltip>
          <button
            onClick={() => console.log("Add link")}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group"
            aria-label="Add Link"
            title="Add Link"
          >
            <Link className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>
          <button
            onClick={() => console.log("Add code")}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group"
            aria-label="Add Code"
            title="Add Code"
          >
            <Code className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>

          <div className="h-5 w-px bg-[#ABD1B5]/30 mx-1"></div>

          {/* Heading Buttons */}
          <button
            onClick={handleH1}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group flex items-center"
            aria-label="Heading 1"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>
          <button
            onClick={handleH2}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group flex items-center"
            aria-label="Heading 2"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>
          <button
            onClick={handleParagraph}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group flex items-center"
            aria-label="Paragraph"
            title="Paragraph"
          >
            <AlignLeft className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>

          <div className="h-5 w-px bg-[#ABD1B5]/30 mx-1"></div>

          {/* Lists */}
          <button
            onClick={() => console.log("Add ordered list")}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group flex items-center"
            aria-label="Ordered List"
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>
          <button
            onClick={() => console.log("Add checklist")}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group flex items-center"
            aria-label="Checklist"
            title="Checklist"
          >
            <ListChecks className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>

          <div className="h-5 w-px bg-[#ABD1B5]/30 mx-1"></div>

          {/* Media Buttons */}
          <button
            onClick={handleAddImage}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group flex items-center"
            aria-label="Add Image"
            title="Add Image"
          >
            <ImagePlus className="h-4 w-4 text-[#13262F]/70 group-hover:text-[#13262F]" />
          </button>

          <div className="h-5 w-px bg-[#ABD1B5]/30 mx-1"></div>

          {/* AI Actions Button */}
          <button
            onClick={handleOpenAiActions}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors group flex items-center"
            aria-label="AI Actions"
            title="AI Actions"
          >
            <Sparkles className="h-4 w-4 text-[#79B791] group-hover:text-[#13262F]" />
          </button>

          <div className="h-5 w-px bg-[#ABD1B5]/30 mx-1"></div>
          <button
            onClick={() => console.log("Show keyboard shortcuts")}
            className="p-1.5 rounded-md hover:bg-[#ABD1B5]/10 transition-colors flex items-center"
            aria-label="Keyboard Shortcuts"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="h-4 w-4 text-[#13262F]/70" />
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={handleChange}
        className="flex-1 w-full p-4 text-[#13262F] bg-white resize-none focus:outline-none focus:ring-0 border-0 max-w-4xl mx-auto"
        placeholder="Type '/' for commands"
        aria-label={`Edit ${pageTitle}`}
        aria-describedby={saveStatus === "error" ? "save-error" : undefined}
      />

      {isShareModalOpen && <ShareModal pageId={pageId} onClose={handleCloseShareModal} />}
      {isAiActionsOpen && <AiActionsPopup onClose={handleCloseAiActions} position={aiPosition} />}
    </div>
  )
}

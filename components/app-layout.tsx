"use client"

import { useState, useEffect } from "react"
import Sidebar from "./sidebar"
import Editor from "./editor"
import { useAppContext } from "@/context/app-context"

type SaveStatus = "idle" | "saving" | "saved" | "error"

export default function AppLayout() {
  const { pages, selectedPageId, setSelectedPageId, updatePage } = useAppContext()
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null)

  // Find the currently selected page
  const selectedPage = pages.find((page) => page._id === selectedPageId) || pages[0]

  // Simulate auto-save functionality
  const triggerSave = () => {
    // Clear any existing timer
    if (saveTimer) {
      clearTimeout(saveTimer)
    }

    // Set a new timer to save after a delay
    const timer = setTimeout(async () => {
      setSaveStatus("saving")

      try {
        // Gerçek kaydetme işlemi
        if (selectedPage) {
          await updatePage(selectedPage._id, { content: selectedPage.content })
          setSaveStatus("saved")
        }
      } catch (error) {
        console.error("Save error:", error)
        setSaveStatus("error")
      }
    }, 500)

    setSaveTimer(timer)
    setSaveStatus("idle")
  }

  // Handle navigation between pages
  const handleNavigate = (pageId: string) => {
    setSelectedPageId(pageId)
  }

  // Handle toggling favorite status
  const handleToggleFavorite = async (pageId: string) => {
    const page = pages.find((p) => p._id === pageId)
    if (page) {
      await updatePage(pageId, { isFavorite: !page.isFavorite })
    }
  }

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    if (selectedPage) {
      updatePage(selectedPage._id, { content: newContent })
      triggerSave()
    }
  }

  // Handle tags changes
  const handleTagsChange = (newTags: string[]) => {
    if (selectedPage) {
      updatePage(selectedPage._id, { tags: newTags })
      triggerSave()
    }
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer) {
        clearTimeout(saveTimer)
      }
    }
  }, [saveTimer])

  // Update the return statement to handle mobile responsiveness better
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="hidden md:block">
          <Sidebar
            pages={pages}
            selectedPageId={selectedPageId}
            onNavigate={handleNavigate}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>
        <div className="flex-1 p-2 md:p-4 overflow-auto bg-[#f8faf8]">
          {selectedPage && (
            <Editor
              title={selectedPage.title}
              pageId={selectedPage._id}
              initialContent={selectedPage.content}
              initialTags={selectedPage.tags}
              saveStatus={saveStatus}
              onChange={handleContentChange}
              onTagsChange={handleTagsChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

import { type NextRequest, NextResponse } from "next/server"
import { getPageById, updatePage, deletePage } from "@/lib/db"
import { verifyJwtToken } from "@/lib/auth"

// Belirli bir sayfayı getirme (GET)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Token'dan kullanıcı kimliğini al
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyJwtToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = payload.id
    const pageId = params.id

    // Sayfayı getir
    const page = await getPageById(pageId)

    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    // Sayfanın kullanıcıya ait olup olmadığını kontrol et
    if (page.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error("Error fetching page:", error)
    return NextResponse.json({ error: "Failed to fetch page" }, { status: 500 })
  }
}

// Sayfayı güncelleme (PATCH)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Token'dan kullanıcı kimliğini al
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyJwtToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = payload.id
    const pageId = params.id

    // Mevcut sayfayı kontrol et
    const existingPage = await getPageById(pageId)

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    // Sayfanın kullanıcıya ait olup olmadığını kontrol et
    if (existingPage.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // İstek gövdesinden güncelleme verilerini al
    const updateData = await request.json()

    // Sayfayı güncelle
    const updatedPage = await updatePage(pageId, updateData)

    if (!updatedPage) {
      return NextResponse.json({ error: "Failed to update page" }, { status: 500 })
    }

    return NextResponse.json({ page: updatedPage })
  } catch (error) {
    console.error("Error updating page:", error)
    return NextResponse.json({ error: "Failed to update page" }, { status: 500 })
  }
}

// Sayfayı silme (DELETE)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Token'dan kullanıcı kimliğini al
    const token = request.cookies.get("token")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyJwtToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const userId = payload.id
    const pageId = params.id

    // Mevcut sayfayı kontrol et
    const existingPage = await getPageById(pageId)

    if (!existingPage) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    // Sayfanın kullanıcıya ait olup olmadığını kontrol et
    if (existingPage.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Sayfayı sil
    const success = await deletePage(pageId)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete page" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting page:", error)
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 })
  }
}

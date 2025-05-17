import { type NextRequest, NextResponse } from "next/server"
import { createPage, getUserPages } from "@/lib/db"
import { verifyJwtToken } from "@/lib/auth"

// Kullanıcının tüm sayfalarını getirme (GET)
export async function GET(request: NextRequest) {
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

    // Kullanıcının sayfalarını getir
    const pages = await getUserPages(userId)

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("Error fetching pages:", error)
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 })
  }
}

// Yeni sayfa oluşturma (POST)
export async function POST(request: NextRequest) {
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

    // İstek gövdesinden sayfa verilerini al
    const { title, content, tags, isFavorite } = await request.json()

    // Sayfa oluştur
    const newPage = await createPage({
      userId,
      title: title || "Untitled",
      content: content || "",
      tags: tags || [],
      isFavorite: isFavorite || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!newPage) {
      return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
    }

    return NextResponse.json({ page: newPage }, { status: 201 })
  } catch (error) {
    console.error("Error creating page:", error)
    return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
  }
}

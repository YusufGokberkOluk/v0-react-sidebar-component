import { type NextRequest, NextResponse } from "next/server"
import { createPage, getUserPages } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Kullanıcının sayfalarını getir
export async function GET(req: NextRequest) {
  try {
    console.log("API: Getting pages...")

    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    console.log("API: User ID:", userId)

    if (!userId) {
      console.log("API: No user ID, unauthorized")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Kullanıcının sayfalarını getir
    console.log("API: Fetching from database...")
    const pages = await getUserPages(userId)
    console.log("API: Found pages:", pages.length)

    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("API: Error fetching pages:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Sayfalar getirilirken bir hata oluştu",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Yeni sayfa oluştur
export async function POST(req: NextRequest) {
  try {
    console.log("API: Creating page...")

    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // İstek gövdesini al
    const { title, content = "", tags = [], isFavorite = false } = await req.json()

    // Sayfa oluştur
    const page = await createPage({
      title,
      content,
      tags,
      isFavorite,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa oluşturulamadı" }, { status: 500 })
    }

    console.log("API: Page created successfully:", page._id)
    return NextResponse.json({ success: true, page }, { status: 201 })
  } catch (error) {
    console.error("API: Error creating page:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Sayfa oluşturulurken bir hata oluştu",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

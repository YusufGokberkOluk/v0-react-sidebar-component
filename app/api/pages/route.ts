import { type NextRequest, NextResponse } from "next/server"
import { createPage, getUserPages } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Kullanıcının sayfalarını getir
export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Kullanıcının sayfalarını getir
    const pages = await getUserPages(userId)
    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("Error fetching pages:", error)
    return NextResponse.json({ success: false, message: "Sayfalar getirilirken bir hata oluştu" }, { status: 500 })
  }
}

// Yeni sayfa oluştur
export async function POST(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // İstek gövdesini al
    const { title, content, tags, isFavorite } = await req.json()

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

    return NextResponse.json({ success: true, page }, { status: 201 })
  } catch (error) {
    console.error("Error creating page:", error)
    return NextResponse.json({ success: false, message: "Sayfa oluşturulurken bir hata oluştu" }, { status: 500 })
  }
}

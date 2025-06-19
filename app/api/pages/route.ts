import { type NextRequest, NextResponse } from "next/server"
import { createPage, getUserPages } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { notifyPageCreated } from "@/lib/notification-service"
import { getCache, setCache, deleteCache } from "@/lib/redis"

// Kullanıcının sayfalarını getir
export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Kullanıcının sayfalarını getir
    const cacheKey = `user_pages:${userId}`
    const cachedPages = await getCache(cacheKey)

    if (cachedPages) {
      return NextResponse.json({ success: true, pages: cachedPages })
    }

    const pages = await getUserPages(userId)
    await setCache(cacheKey, pages, 300) // 5 minutes cache

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

    await notifyPageCreated(userId, page._id.toString(), page.title)

    await deleteCache(`user_pages:${userId}`)

    return NextResponse.json({ success: true, page }, { status: 201 })
  } catch (error) {
    console.error("Error creating page:", error)
    return NextResponse.json({ success: false, message: "Sayfa oluşturulurken bir hata oluştu" }, { status: 500 })
  }
}

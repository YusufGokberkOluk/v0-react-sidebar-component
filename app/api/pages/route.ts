import { type NextRequest, NextResponse } from "next/server"
import { createPage, getUserPages } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"
import { notifyPageCreated } from "@/lib/notification-service"
import { getCache, setCache, deleteCache } from "@/lib/redis"

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

    // Redis cache kontrolü (hata durumunda devam et)
    let cachedPages = null
    try {
      const cacheKey = `user_pages:${userId}`
      cachedPages = await getCache(cacheKey)
      console.log("API: Cache result:", cachedPages ? "found" : "not found")
    } catch (cacheError) {
      console.log("API: Cache error (continuing):", cacheError)
    }

    if (cachedPages) {
      return NextResponse.json({ success: true, pages: cachedPages })
    }

    // Kullanıcının sayfalarını getir
    console.log("API: Fetching from database...")
    const pages = await getUserPages(userId)
    console.log("API: Found pages:", pages.length)

    // Cache'e kaydet (hata durumunda devam et)
    try {
      const cacheKey = `user_pages:${userId}`
      await setCache(cacheKey, pages, 300)
    } catch (cacheError) {
      console.log("API: Cache set error (continuing):", cacheError)
    }

    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("API: Error fetching pages:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Sayfalar getirilirken bir hata oluştu",
        error: error.message,
      },
      { status: 500 },
    )
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

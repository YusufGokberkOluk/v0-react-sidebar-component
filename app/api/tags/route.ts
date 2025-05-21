import { type NextRequest, NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { getMongoDb } from "@/lib/mongodb"

export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // MongoDB'den kullanıcının tüm sayfalarını getir
    const db = await getMongoDb()
    const pages = await db.collection("pages").find({ userId }).project({ tags: 1 }).toArray()

    // Tüm tag'leri topla ve tekrar edenleri kaldır
    const allTags = pages.reduce((tags: string[], page: any) => {
      if (page.tags && Array.isArray(page.tags)) {
        return [...tags, ...page.tags]
      }
      return tags
    }, [])

    // Benzersiz tag'leri al ve alfabetik olarak sırala
    const uniqueTags = [...new Set(allTags)].sort()

    return NextResponse.json({
      success: true,
      tags: uniqueTags,
    })
  } catch (error) {
    console.error("Error fetching tags:", error)
    return NextResponse.json({ success: false, message: "Tag'ler getirilirken bir hata oluştu" }, { status: 500 })
  }
}

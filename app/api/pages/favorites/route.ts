import { type NextRequest, NextResponse } from "next/server"
import { getUserFavoritePages } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Kullanıcının favori sayfalarını getir
export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Kullanıcının favori sayfalarını getir
    const pages = await getUserFavoritePages(userId)
    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("Error fetching favorite pages:", error)
    return NextResponse.json(
      { success: false, message: "Favori sayfalar getirilirken bir hata oluştu" },
      { status: 500 },
    )
  }
}

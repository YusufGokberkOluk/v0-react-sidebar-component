import { type NextRequest, NextResponse } from "next/server"
import { searchPages } from "@/lib/db"
import { verifyAuth } from "@/lib/auth"

// Kullanıcının sayfalarını ara
export async function GET(req: NextRequest) {
  try {
    // Kullanıcı kimliğini doğrula
    const userId = await verifyAuth(req)
    if (!userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // URL'den sorgu parametresini al
    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ success: false, message: "Arama sorgusu gereklidir" }, { status: 400 })
    }

    // Kullanıcının sayfalarını ara
    const pages = await searchPages(userId, query)
    return NextResponse.json({ success: true, pages })
  } catch (error) {
    console.error("Error searching pages:", error)
    return NextResponse.json({ success: false, message: "Sayfalar aranırken bir hata oluştu" }, { status: 500 })
  }
}

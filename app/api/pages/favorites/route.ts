import { type NextRequest, NextResponse } from "next/server"
import { getUserFavoritePages } from "@/lib/db"
import { verifyJwtToken } from "@/lib/auth"

// Kullanıcının favori sayfalarını getirme (GET)
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

    // Kullanıcının favori sayfalarını getir
    const pages = await getUserFavoritePages(userId)

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("Error fetching favorite pages:", error)
    return NextResponse.json({ error: "Failed to fetch favorite pages" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { searchPages } from "@/lib/db"
import { verifyJwtToken } from "@/lib/auth"

// Sayfa arama (GET)
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

    // URL'den arama sorgusunu al
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""

    // Sayfaları ara
    const pages = await searchPages(userId, query)

    return NextResponse.json({ pages })
  } catch (error) {
    console.error("Error searching pages:", error)
    return NextResponse.json({ error: "Failed to search pages" }, { status: 500 })
  }
}

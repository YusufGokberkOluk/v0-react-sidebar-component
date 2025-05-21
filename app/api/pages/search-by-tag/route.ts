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

    // URL'den tag parametresini al
    const searchParams = req.nextUrl.searchParams
    const tag = searchParams.get("tag")

    if (!tag) {
      return NextResponse.json({ success: false, message: "Tag parametresi gereklidir" }, { status: 400 })
    }

    // MongoDB'den kullanıcının belirtilen tag'e sahip sayfalarını getir
    const db = await getMongoDb()
    const pages = await db
      .collection("pages")
      .find({
        userId: userId,
        tags: { $in: [tag] },
      })
      .toArray()

    return NextResponse.json({
      success: true,
      pages: pages.map((page) => ({
        ...page,
        _id: page._id.toString(),
      })),
    })
  } catch (error) {
    console.error("Error searching pages by tag:", error)
    return NextResponse.json({ success: false, message: "Tag ile sayfa aranırken bir hata oluştu" }, { status: 500 })
  }
}

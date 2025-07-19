import { type NextRequest, NextResponse } from "next/server"
import { getMongoDb } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Genel paylaşım linki ile sayfaya erişim
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pageId = params.id
    const db = await getMongoDb()

    // Sayfayı getir
    const page = await db.collection("pages").findOne({
      _id: new ObjectId(pageId),
    })

    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    // Sayfa sahibinin bilgilerini getir
    const owner = await db.collection("users").findOne({
      _id: new ObjectId(page.userId),
    })

    // Genel erişim için sayfa bilgilerini döndür (sadece okunabilir)
    return NextResponse.json({
      success: true,
      page: {
        _id: page._id.toString(),
        title: page.title,
        content: page.content,
        tags: page.tags,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
        owner: {
          name: owner?.name || "Anonim",
          email: owner?.email?.split("@")[0] + "@***", // E-postayı gizle
        },
      },
      accessLevel: "view", // Genel erişim sadece görüntüleme
    })
  } catch (error) {
    console.error("Genel paylaşım hatası:", error)
    return NextResponse.json({ success: false, message: "Sayfa yüklenirken bir hata oluştu" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { addTemplateToFavorites, removeTemplateFromFavorites, getUserFavoriteTemplates } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "etude-app-secret-key"

// Kullanıcı kimliğini doğrulama
async function authenticateUser(req: NextRequest) {
  const token = cookies().get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string; email: string }
    return decoded
  } catch (error) {
    return null
  }
}

// Kullanıcının favori şablonlarını getir
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const favorites = await getUserFavoriteTemplates(auth.userId)

    return NextResponse.json({ success: true, favorites }, { status: 200 })
  } catch (error) {
    console.error("Get favorites error:", error)
    return NextResponse.json({ success: false, message: "Favoriler alınırken bir hata oluştu" }, { status: 500 })
  }
}

// Şablonu favorilere ekle
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const { templateId } = await req.json()

    if (!templateId) {
      return NextResponse.json({ success: false, message: "Şablon ID'si gereklidir" }, { status: 400 })
    }

    const success = await addTemplateToFavorites(auth.userId, templateId)

    if (!success) {
      return NextResponse.json({ success: false, message: "Şablon favorilere eklenemedi" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Şablon favorilere eklendi" }, { status: 200 })
  } catch (error) {
    console.error("Add to favorites error:", error)
    return NextResponse.json(
      { success: false, message: "Şablon favorilere eklenirken bir hata oluştu" },
      { status: 500 },
    )
  }
}

// Şablonu favorilerden çıkar
export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const { templateId } = await req.json()

    if (!templateId) {
      return NextResponse.json({ success: false, message: "Şablon ID'si gereklidir" }, { status: 400 })
    }

    const success = await removeTemplateFromFavorites(auth.userId, templateId)

    if (!success) {
      return NextResponse.json({ success: false, message: "Şablon favorilerden çıkarılamadı" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Şablon favorilerden çıkarıldı" }, { status: 200 })
  } catch (error) {
    console.error("Remove from favorites error:", error)
    return NextResponse.json(
      { success: false, message: "Şablon favorilerden çıkarılırken bir hata oluştu" },
      { status: 500 },
    )
  }
}

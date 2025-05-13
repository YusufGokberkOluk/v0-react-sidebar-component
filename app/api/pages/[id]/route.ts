import { type NextRequest, NextResponse } from "next/server"
import { updatePage, deletePage } from "@/lib/db"
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

// Sayfa güncelleme
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const pageId = params.id
    const updateData = await req.json()

    const updatedPage = await updatePage(pageId, updateData)

    if (!updatedPage) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı veya güncellenemedi" }, { status: 404 })
    }

    return NextResponse.json({ success: true, page: updatedPage }, { status: 200 })
  } catch (error) {
    console.error("Update page error:", error)
    return NextResponse.json({ success: false, message: "Sayfa güncellenirken bir hata oluştu" }, { status: 500 })
  }
}

// Sayfa silme
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const pageId = params.id

    const success = await deletePage(pageId)

    if (!success) {
      return NextResponse.json({ success: false, message: "Sayfa bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Sayfa başarıyla silindi" }, { status: 200 })
  } catch (error) {
    console.error("Delete page error:", error)
    return NextResponse.json({ success: false, message: "Sayfa silinirken bir hata oluştu" }, { status: 500 })
  }
}

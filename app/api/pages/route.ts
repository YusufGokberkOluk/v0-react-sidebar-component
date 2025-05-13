import { type NextRequest, NextResponse } from "next/server"
import { createPage, getUserPages } from "@/lib/db"
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

// Kullanıcının tüm sayfalarını getir
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const pages = await getUserPages(auth.userId)

    return NextResponse.json({ success: true, pages }, { status: 200 })
  } catch (error) {
    console.error("Get pages error:", error)
    return NextResponse.json({ success: false, message: "Sayfalar alınırken bir hata oluştu" }, { status: 500 })
  }
}

// Yeni sayfa oluştur
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const pageData = await req.json()

    // Kullanıcı ID'sini ekle
    pageData.userId = auth.userId

    const page = await createPage(pageData)

    if (!page) {
      return NextResponse.json({ success: false, message: "Sayfa oluşturulamadı" }, { status: 500 })
    }

    return NextResponse.json({ success: true, page }, { status: 201 })
  } catch (error) {
    console.error("Create page error:", error)
    return NextResponse.json({ success: false, message: "Sayfa oluşturulurken bir hata oluştu" }, { status: 500 })
  }
}

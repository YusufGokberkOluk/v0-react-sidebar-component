import { type NextRequest, NextResponse } from "next/server"
import { updateUserPreferences } from "@/lib/db"
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

// Kullanıcı tercihlerini güncelleme
export async function PUT(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const preferences = await req.json()

    const updatedPreferences = await updateUserPreferences(auth.userId, preferences)

    if (!updatedPreferences) {
      return NextResponse.json({ success: false, message: "Tercihler güncellenemedi" }, { status: 500 })
    }

    return NextResponse.json({ success: true, preferences: updatedPreferences }, { status: 200 })
  } catch (error) {
    console.error("Update preferences error:", error)
    return NextResponse.json({ success: false, message: "Tercihler güncellenirken bir hata oluştu" }, { status: 500 })
  }
}

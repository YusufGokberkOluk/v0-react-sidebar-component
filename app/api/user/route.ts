import { type NextRequest, NextResponse } from "next/server"
import { getUserById, updateUser, deleteUser } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

// JWT için gizli anahtar (gerçek uygulamada env değişkeni olarak saklanmalı)
const JWT_SECRET = "etude-app-secret-key"

// Kullanıcı kimliğini doğrulama middleware
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

// Kullanıcı bilgilerini getir
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const user = await getUserById(auth.userId)

    if (!user) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json({ success: true, user }, { status: 200 })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { success: false, message: "Kullanıcı bilgileri alınırken bir hata oluştu" },
      { status: 500 },
    )
  }
}

// Kullanıcı bilgilerini güncelle
export async function PUT(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const userData = await req.json()

    // E-posta değişikliği engelle (ayrı bir API endpoint'i olabilir)
    if (userData.email) {
      delete userData.email
    }

    const updatedUser = await updateUser(auth.userId, userData)

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    return NextResponse.json(
      { success: true, message: "Kullanıcı bilgileri güncellendi", user: updatedUser },
      { status: 200 },
    )
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { success: false, message: "Kullanıcı bilgileri güncellenirken bir hata oluştu" },
      { status: 500 },
    )
  }
}

// Kullanıcı hesabını sil
export async function DELETE(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const success = await deleteUser(auth.userId)

    if (!success) {
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı" }, { status: 404 })
    }

    // Auth token çerezini sil
    cookies().delete("auth_token")

    return NextResponse.json({ success: true, message: "Kullanıcı hesabı başarıyla silindi" }, { status: 200 })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { success: false, message: "Kullanıcı hesabı silinirken bir hata oluştu" },
      { status: 500 },
    )
  }
}

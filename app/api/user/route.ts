import { type NextRequest, NextResponse } from "next/server"
import { getUserById, updateUser, deleteUser } from "@/lib/db"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"

// JWT için gizli anahtar
const JWT_SECRET = process.env.JWT_SECRET || "etude-app-secret-key"

// Kullanıcı kimliğini doğrulama middleware
async function authenticateUser(req: NextRequest) {
  const token = cookies().get("auth_token")?.value

  if (!token) {
    console.log("No auth_token found in cookies")
    return null
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { id: string; email: string }
    console.log("Token verified successfully for user:", decoded.email)
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

async function verifyJwtToken(token: string): Promise<any> {
  try {
    const decoded = verify(token, JWT_SECRET) as { id: string; email: string }
    return decoded
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

async function deleteAllUserPages(userId: string): Promise<void> {
  // Implement the logic to delete all pages associated with the user
  // This is a placeholder, replace with your actual implementation
  console.log(`Deleting all pages for user: ${userId}`)
  return Promise.resolve()
}

// Kullanıcı bilgilerini getir
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateUser(req)

    if (!auth) {
      return NextResponse.json({ success: false, message: "Yetkilendirme başarısız" }, { status: 401 })
    }

    const user = await getUserById(auth.id)

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

// Kullanıcı bilgilerini güncelleme (PATCH)
export async function PATCH(request: NextRequest) {
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

    // İstek gövdesinden güncelleme verilerini al
    const updateData = await request.json()

    // Kullanıcıyı güncelle
    const updatedUser = await updateUser(userId, updateData)

    if (!updatedUser) {
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

// Kullanıcıyı silme (DELETE)
export async function DELETE(request: NextRequest) {
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

    // Önce kullanıcının tüm sayfalarını sil
    await deleteAllUserPages(userId)

    // Sonra kullanıcıyı sil
    const success = await deleteUser(userId)

    if (!success) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    // Çerezi temizle
    const response = NextResponse.json({ success: true })
    response.cookies.delete("token")

    return response
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getUserById, updateUser, deleteUser, deleteAllUserPages } from "@/lib/db"
import { verifyJwtToken } from "@/lib/auth"

// Kullanıcı bilgilerini getirme (GET)
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

    // Kullanıcı bilgilerini getir
    const user = await getUserById(userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
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

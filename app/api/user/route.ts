import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { getUserById, deleteUser, updateUser } from "@/lib/db"

const JWT_SECRET = process.env.JWT_SECRET || "etude-app-secret-key"

export async function GET() {
  try {
    // Cookie'den token al
    const cookieStore = cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      console.log("No token found")
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string }

      // Kullanıcı bilgilerini getir
      const user = await getUserById(decoded.id)

      if (!user) {
        console.log("User not found")
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
      }

      // Kullanıcı bilgilerini döndür (şifre hariç)
      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      })
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError)
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("User fetch error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

// GET fonksiyonundan sonra DELETE fonksiyonunu ekle:

export async function DELETE() {
  try {
    // Cookie'den token al
    const cookieStore = cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string }

      // Kullanıcıyı sil (bu fonksiyon tüm sayfaları da siler)
      const deleted = await deleteUser(decoded.id)

      if (!deleted) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
      }

      // Cookie'yi temizle
      const response = NextResponse.json({ success: true, message: "Account deleted successfully" })
      response.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        expires: new Date(0), // Geçmişte bir tarih
      })

      return response
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError)
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("User deletion error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

// PUT fonksiyonunu da ekle (profil güncelleme için):

export async function PUT(request: Request) {
  try {
    // Cookie'den token al
    const cookieStore = cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    try {
      // Token'ı doğrula
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string }

      // Request body'yi al
      const body = await request.json()

      // Kullanıcıyı güncelle
      const updatedUser = await updateUser(decoded.id, body)

      if (!updatedUser) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id?.toString(),
          name: updatedUser.name,
          email: updatedUser.email,
        },
      })
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError)
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("User update error:", error)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}

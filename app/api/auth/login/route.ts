import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/db"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"

// JWT için gizli anahtar
const JWT_SECRET = process.env.JWT_SECRET || "etude-app-secret-key"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    // Basit doğrulama
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email ve şifre gereklidir" }, { status: 400 })
    }

    try {
      // Kullanıcı girişi
      const user = await loginUser(email, password)

      if (!user) {
        return NextResponse.json({ success: false, message: "Geçersiz e-posta veya şifre" }, { status: 401 })
      }

      // JWT token oluştur
      const token = sign(
        {
          id: user._id,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "7d" },
      )

      // Token'ı çerezlere kaydet
      cookies().set({
        name: "auth_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 gün
        path: "/",
      })

      return NextResponse.json(
        {
          success: true,
          message: "Giriş başarılı",
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        },
        { status: 200 },
      )
    } catch (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json({ success: false, message: "Veritabanı hatası" }, { status: 500 })
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Giriş sırasında bir hata oluştu" }, { status: 500 })
  }
}

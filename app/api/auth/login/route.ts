import { type NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/db"
import { cookies } from "next/headers"
import { sign } from "jsonwebtoken"

// JWT için gizli anahtar
const JWT_SECRET = process.env.JWT_SECRET || "etude-app-secret-key"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    console.log("Login attempt for:", email)

    // Basit doğrulama
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email ve şifre gereklidir" }, { status: 400 })
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Geçerli bir email adresi giriniz" }, { status: 400 })
    }

    // Kullanıcı girişi
    const user = await loginUser(email, password)

    if (!user) {
      console.log("Login failed for:", email)
      return NextResponse.json({ success: false, message: "Geçersiz e-posta veya şifre" }, { status: 401 })
    }

    // JWT token oluştur
    const token = sign(
      {
        id: user._id.toString(),
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    )

    // Token'ı çerezlere kaydet
    cookies().set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: "/",
    })

    console.log("Login successful for:", email)
    return NextResponse.json(
      {
        success: true,
        message: "Giriş başarılı",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      },
      { status: 500 },
    )
  }
}

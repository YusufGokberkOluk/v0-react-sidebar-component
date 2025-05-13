import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    // Basit doğrulama
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email ve şifre gereklidir" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "Şifre en az 6 karakter olmalıdır" }, { status: 400 })
    }

    // Kullanıcı oluştur
    const user = await createUser({ name, email, password })

    if (!user) {
      return NextResponse.json({ success: false, message: "Bu e-posta adresi zaten kullanımda" }, { status: 409 })
    }

    return NextResponse.json({ success: true, message: "Hesabınız başarıyla oluşturuldu", user }, { status: 201 })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ success: false, message: "Kayıt sırasında bir hata oluştu" }, { status: 500 })
  }
}

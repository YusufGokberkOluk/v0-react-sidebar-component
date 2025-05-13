import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    // Derleme sırasında çalışmayı önlemek için kontrol
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.log("Skipping API execution during build")
      return new Response(JSON.stringify({ message: "Build time, skipping execution" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { name, email, password } = await req.json()
    console.log("Signup attempt:", { name, email })

    // Basit doğrulama
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email ve şifre gereklidir" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "Şifre en az 6 karakter olmalıdır" }, { status: 400 })
    }

    // Kullanıcı oluştur
    try {
      const user = await createUser({ name, email, password })

      if (!user) {
        console.log("Failed to create user, email might be in use:", email)
        return NextResponse.json({ success: false, message: "Bu e-posta adresi zaten kullanımda" }, { status: 409 })
      }

      console.log("User created successfully:", email)
      return NextResponse.json({ success: true, message: "Hesabınız başarıyla oluşturuldu", user }, { status: 201 })
    } catch (createError) {
      console.error("Error during user creation:", createError)
      return NextResponse.json({ success: false, message: "Kullanıcı oluşturulurken bir hata oluştu" }, { status: 500 })
    }
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ success: false, message: "Kayıt sırasında bir hata oluştu" }, { status: 500 })
  }
}

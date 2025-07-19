import { type NextRequest, NextResponse } from "next/server"
import { createUser } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()
    console.log("Signup attempt:", { name, email })

    // Basit doğrulama
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email ve şifre gereklidir" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "Şifre en az 6 karakter olmalıdır" }, { status: 400 })
    }

    // Email format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, message: "Geçerli bir email adresi giriniz" }, { status: 400 })
    }

    // Kullanıcı oluştur
    const user = await createUser({
      name: name || "",
      email,
      password,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (!user) {
      console.log("Failed to create user, email might be in use:", email)
      return NextResponse.json({ success: false, message: "Bu e-posta adresi zaten kullanımda" }, { status: 409 })
    }

    console.log("User created successfully:", email)
    return NextResponse.json(
      {
        success: true,
        message: "Hesabınız başarıyla oluşturuldu",
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.",
      },
      { status: 500 },
    )
  }
}

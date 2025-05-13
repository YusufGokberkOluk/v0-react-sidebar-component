import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Auth token çerezini sil
    cookies().delete("auth_token")

    return NextResponse.json({ success: true, message: "Çıkış başarılı" }, { status: 200 })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "Çıkış sırasında bir hata oluştu" }, { status: 500 })
  }
}

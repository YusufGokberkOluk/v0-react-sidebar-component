import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { getUserById } from "@/lib/db"

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

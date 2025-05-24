import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

// JWT token oluştur
export function createJwtToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" })
}

// JWT token doğrula
export function verifyJwtToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string }
    return decoded.id
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

// İstek üzerinden kimlik doğrulama
export async function verifyAuth(req: NextRequest): Promise<string | null> {
  try {
    // Cookie'den token al
    const token = req.cookies.get("token")?.value

    if (!token) {
      console.log("No token found in cookies")
      return null
    }

    // Token'ı doğrula
    const userId = verifyJwtToken(token)

    if (!userId) {
      console.log("Invalid token")
      return null
    }

    return userId
  } catch (error) {
    console.error("Auth verification error:", error)
    return null
  }
}

// Sunucu tarafında kimlik doğrulama (API rotaları dışında)
export async function getServerSideAuth(): Promise<string | null> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return null
    }

    return verifyJwtToken(token)
  } catch (error) {
    console.error("Server-side auth error:", error)
    return null
  }
}

// HTTP request'inden kullanıcı bilgilerini al
export async function getUserFromRequest(req: NextRequest): Promise<any | null> {
  try {
    // Cookie'den token al
    const token = req.cookies.get("token")?.value

    if (!token) {
      console.log("No token found in cookies")
      return null
    }

    // Token'ı doğrula
    const userId = verifyJwtToken(token)

    if (!userId) {
      console.log("Invalid token")
      return null
    }

    // Veritabanından kullanıcı bilgilerini getir
    const { getUserById } = await import("@/lib/db")
    const user = await getUserById(userId)

    if (!user) {
      console.log("User not found in database")
      return null
    }

    return user
  } catch (error) {
    console.error("getUserFromRequest error:", error)
    return null
  }
}

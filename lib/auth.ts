import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"
import { getUserById } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export interface AuthUser {
  _id: string
  name: string
  email: string
}

// JWT token oluşturma
export function createToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  )
}

// JWT token doğrulama
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

// HTTP request'inden kullanıcı bilgilerini alma - EKSİK OLAN FONKSİYON
export async function getUserFromRequest(req: NextRequest): Promise<AuthUser | null> {
  try {
    // Cookie'den token'ı al
    const token = req.cookies.get("auth-token")?.value

    if (!token) {
      console.log("No auth token found in cookies")
      return null
    }

    // Token'ı doğrula
    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      console.log("Invalid token")
      return null
    }

    // Veritabanından kullanıcıyı getir
    const user = await getUserById(decoded.userId)
    if (!user) {
      console.log("User not found in database")
      return null
    }

    return {
      _id: user._id as string,
      name: user.name || "",
      email: user.email,
    }
  } catch (error) {
    console.error("Error getting user from request:", error)
    return null
  }
}

// Kullanıcı kimlik doğrulama (eski fonksiyon - geriye dönük uyumluluk için)
export async function verifyAuth(req: NextRequest) {
  return await getUserFromRequest(req)
}

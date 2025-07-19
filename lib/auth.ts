import jwt from "jsonwebtoken"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export function generateToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    return decoded.userId
  } catch (error) {
    return null
  }
}

export async function verifyAuth(req: NextRequest): Promise<string | null> {
  try {
    // Cookie'den token'ı al
    const token = req.cookies.get("auth-token")?.value

    if (!token) {
      return null
    }

    // Token'ı doğrula
    const userId = verifyToken(token)
    return userId
  } catch (error) {
    console.error("Auth verification error:", error)
    return null
  }
}

import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET || "etude-app-secret-key"

interface JwtPayload {
  id: string
  email: string
  name?: string
}

// JWT token oluşturma
export function createJwtToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

// JWT token doğrulama
export async function verifyJwtToken(token: string): Promise<JwtPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch (error) {
    console.error("JWT verification error:", error)
    return null
  }
}

// Kullanıcı kimliğini token'dan alma
export async function getUserIdFromToken(): Promise<string | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  const payload = await verifyJwtToken(token)
  return payload?.id || null
}

// Kimlik doğrulama yardımcı fonksiyonları
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "etude-app-secret-key"

export async function authenticateUser(req: NextRequest) {
  const token = cookies().get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    const decoded = verify(token, JWT_SECRET) as { userId: string; email: string }
    return decoded
  } catch (error) {
    return null
  }
}

// Rate limiting için basit bir çözüm
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(ip: string, limit = 100, windowMs = 60000): boolean {
  const now = Date.now()

  if (!ipRequestCounts.has(ip)) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  const requestData = ipRequestCounts.get(ip)!

  if (now > requestData.resetTime) {
    // Zaman penceresi geçti, sayacı sıfırla
    ipRequestCounts.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  // Limit aşıldı mı kontrol et
  if (requestData.count >= limit) {
    return false
  }

  // Sayacı artır
  requestData.count++
  ipRequestCounts.set(ip, requestData)

  return true
}

// API isteklerini loglama ve hata yakalama için middleware
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logger } from "./lib/logger"

export function middleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  // İstek başlangıcını logla
  logger.info(`[${requestId}] ${request.method} ${request.nextUrl.pathname} - Request started`)

  const response = NextResponse.next()

  // İstek bitişini logla
  response.headers.set("X-Request-Id", requestId)

  // Yanıt gönderildikten sonra loglama
  response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`)

  logger.info(
    `[${requestId}] ${request.method} ${request.nextUrl.pathname} - Response sent in ${Date.now() - startTime}ms`,
  )

  return response
}

export const config = {
  matcher: "/api/:path*",
}

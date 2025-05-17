import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Giriş yapılmış mı kontrol et
  const authToken = request.cookies.get("auth_token")?.value

  // Korumalı rotalar
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/app") || request.nextUrl.pathname.startsWith("/settings")

  // Kimlik doğrulama sayfaları
  const isAuthPage = request.nextUrl.pathname.startsWith("/sign-in") || request.nextUrl.pathname.startsWith("/sign-up")

  // Eğer korumalı bir sayfaya erişmeye çalışıyorsa ve giriş yapmamışsa
  if (isProtectedRoute && !authToken) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  // Eğer giriş yapmışsa ve kimlik doğrulama sayfalarına erişmeye çalışıyorsa
  if (isAuthPage && authToken) {
    return NextResponse.redirect(new URL("/app", request.url))
  }

  return NextResponse.next()
}

// Middleware'in çalışacağı yollar
export const config = {
  matcher: ["/app/:path*", "/settings/:path*", "/sign-in", "/sign-up"],
}

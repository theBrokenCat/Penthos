import { NextRequest, NextResponse } from "next/server"

export function middleware(req: NextRequest) {
  const isPublicPath =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname === "/setup" ||
    req.nextUrl.pathname.startsWith("/api/setup")

  // Por ahora, permitir que next-auth maneje la autenticación
  // El middleware no puede acceder a la BD directamente (edge runtime)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}

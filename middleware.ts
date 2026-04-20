import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')
  
  // Check for any Supabase auth cookie
  const hasCookie = Array.from(request.cookies.getAll()).some(
    cookie => cookie.name.includes('supabase') || cookie.name.includes('sb-')
  )

  if (!hasCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (hasCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}

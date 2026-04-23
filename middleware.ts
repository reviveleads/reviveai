import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always public — no auth required
  const publicPaths = ['/', '/terms', '/privacy', '/login', '/unsubscribe']
  if (publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next()
  }

  // Also allow all API routes through
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    'https://plxyxexgtopmwbcvotit.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseHl4ZXhndG9wbXdiY3ZvdGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjUxMDUsImV4cCI6MjA4OTYwMTEwNX0.FQ1Fq2Oa25Ewa4rXTVx5Gxhzg3f72Z9Lwm0bJ_qRDF4',
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/listings',
  '/my-listings',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is protected
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (!isProtected) return NextResponse.next();

  // Build a response we can attach cookie mutations to
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Create a Supabase client that reads cookies from the request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // Redirect to login, preserving the intended destination
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Run middleware on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|icons|api).*)'],
};

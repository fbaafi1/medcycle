import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Auth protection is handled client-side via AuthGuard component
// because the app uses @supabase/supabase-js (localStorage sessions),
// not @supabase/ssr (cookie sessions). Middleware cannot read localStorage.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

// /middleware.ts
// SECURITY NOTE (GapFix Gap 21): This middleware protects server routes from
// unauthenticated access. Firebase token verification happens inside each route
// handler — middleware only enforces that certain paths are unreachable without
// a session cookie. Do NOT move API key access to client components.

import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PATHS = [
  '/assistant',
  '/scanner',
  '/project',
  '/research',
  '/history',
  '/progress',
  '/faculty',
];

// API routes that are publicly accessible (no auth needed)
const PUBLIC_API_PATHS = [
  '/api/users/upsert',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes: checked inside handlers by ADMIN_SECRET header
  if (pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // Cron routes: checked inside handlers by CRON_SECRET
  if (pathname.startsWith('/api/cron')) {
    return NextResponse.next();
  }

  // Public API paths pass through
  for (const pub of PUBLIC_API_PATHS) {
    if (pathname.startsWith(pub)) return NextResponse.next();
  }

  // Protected page routes: redirect to login if no session cookie
  for (const path of PROTECTED_PATHS) {
    if (pathname.startsWith(path)) {
      const sessionCookie = req.cookies.get('firebase-session');
      if (!sessionCookie?.value) {
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg).*)',
  ],
};

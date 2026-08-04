// /middleware.ts
// Temporary middleware while using Firebase client authentication.
// This allows protected pages to load after Google Sign-In.
// API routes still perform their own Firebase token verification.

import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.ico).*)',
  ],
};
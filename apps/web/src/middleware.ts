import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('accessToken')?.value;

  if (!token && !publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && publicPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/feed', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|uploads|favicon.ico).*)'],
};

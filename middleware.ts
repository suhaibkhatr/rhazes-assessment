import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.has('userId');

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];
  const protectedRoutes = ['/starred' , '/'];

  // If the user is not authenticated and trying to access a protected route
  if (!isAuthenticated && (protectedRoutes.includes(pathname) || (!publicRoutes.includes(pathname) && pathname !== '/'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated and trying to access login/register pages
  if (isAuthenticated && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
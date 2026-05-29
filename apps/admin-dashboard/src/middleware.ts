import { NextRequest, NextResponse } from 'next/server';

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    return decoded.role || null;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get token from cookie (we'll set it on login)
  const token = req.cookies.get('shms_token')?.value;

  const isAuthPage = pathname === '/auth';
  const isSuperAdminPath = pathname.startsWith('/super-admin');
  const isDashboardPath = !isAuthPage && !isSuperAdminPath;

  if (!token) {
    // No token — redirect to /auth unless already there
    if (!isAuthPage) {
      return NextResponse.redirect(new URL('/auth', req.url));
    }
    return NextResponse.next();
  }

  const role = decodeJwtRole(token);

  // SUPER_ADMIN trying to access regular dashboard → redirect to /super-admin
  if (role === 'SUPER_ADMIN' && isDashboardPath) {
    return NextResponse.redirect(new URL('/super-admin', req.url));
  }

  // Non-super-admin trying to access /super-admin → redirect to /pos
  if (role !== 'SUPER_ADMIN' && isSuperAdminPath) {
    return NextResponse.redirect(new URL('/pos', req.url));
  }

  // Authenticated user on /auth → redirect to correct dashboard
  if (isAuthPage) {
    return NextResponse.redirect(new URL(role === 'SUPER_ADMIN' ? '/super-admin' : '/pos', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};

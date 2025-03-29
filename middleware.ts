import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Helper function to verify JWT token
async function verifyAuth(token: string) {
  try {
    // Convert secret to Uint8Array as required by jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    
    // Verify the token
    const { payload } = await jwtVerify(token, secret);
    
    return { isValid: true, payload };
  } catch (error) {
    return { isValid: false };
  }
}

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl;
  
  // Allow access to API routes, login page and static files
  if (
    pathname.startsWith('/api/auth') || 
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }
  
  // Check for authentication cookie
  const authToken = request.cookies.get('auth_token')?.value;
  
  // If no auth token, redirect to login
  if (!authToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  // Verify the token
  const { isValid } = await verifyAuth(authToken);
  
  if (!isValid) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Specify which paths this middleware will run on
export const config = {
  matcher: [
    // Apply to all routes except for static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
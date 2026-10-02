import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Define public routes (accessible without auth)
  const publicRoutes = ['/auth/login', '/api/auth/callback'];

  // If user is not signed in and trying to access a protected route
  if (!session && !publicRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  // If user is signed in, check role-based access
  if (session) {
    try {
      // Fetch user profile to check role
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, station_id')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;

      // Admin routes protection
      if (pathname.startsWith('/admin') && profile.role !== 'admin') {
        // Redirect to station dashboard if station_user tries to access admin
        const url = request.nextUrl.clone();
        url.pathname = '/station';
        return NextResponse.redirect(url);
      }

      // Station routes protection
      if (pathname.startsWith('/station') && profile.role !== 'station_user') {
        // Redirect to admin dashboard if admin tries to access station
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }

      // Additional specific route protections can be added here
      // Example: /admin/overages, /admin/payments, etc.

    } catch (error) {
      console.error('Error checking profile:', error);
      // If there's an error fetching profile, redirect to login
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
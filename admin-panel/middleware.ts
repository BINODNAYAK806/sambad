import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (not persistent across serverless invocations, 
// but works for standard Node/Dev/Single-instance deployments)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 100; // requests
const WINDOW = 60 * 1000; // 1 minute

export function middleware(request: NextRequest) {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();

    // 1. Rate Limiting for API routes
    if (request.nextUrl.pathname.startsWith('/api')) {
        const rateData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

        if (now - rateData.lastReset > WINDOW) {
            rateData.count = 0;
            rateData.lastReset = now;
        }

        rateData.count++;
        rateLimitMap.set(ip, rateData);

        if (rateData.count > LIMIT) {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }

    // 2. CSRF Mitigation (Basic check: Ensure Origin/Referer matches when POSTing)
    if (request.method === 'POST') {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');

        if (origin && !origin.includes(host || '')) {
            return new NextResponse('Invalid Origin (Potential CSRF)', { status: 403 });
        }
    }

    // 3. Security Check - Basic Admin Secret (Optional, for demo)
    // In a real app, you'd check for a Supabase session or a specific Auth cookie.
    // const adminSecret = request.headers.get('x-admin-secret');
    // if (request.nextUrl.pathname.startsWith('/api') && adminSecret !== process.env.ADMIN_SECRET) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};

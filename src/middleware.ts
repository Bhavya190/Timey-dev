import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "timey-secure-jwt-secret-key-123456"
);

async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("auth_token")?.value;

    // If user is already logged in and tries to access login page, redirect to dashboard
    if (pathname === "/" && token) {
        const payload = await verifyToken(token);
        if (payload) {
            const role = (payload.role as string || "").toLowerCase();
            if (role === "admin" || role === "teamlead") {
                return NextResponse.redirect(new URL("/admin", request.url));
            }
            return NextResponse.redirect(new URL("/employee", request.url));
        }
    }

    // Allow static files and home page (for unauthenticated users)
    if (pathname === "/" || pathname.startsWith("/_next") || pathname.includes(".")) {
        return NextResponse.next();
    }

    if (!token) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    try {
        const { payload } = await jwtVerify(token, secret);
        const role = (payload.role as string || "").toLowerCase();

        console.log(`Middleware Trace: path=${pathname}, role=${role}`);

        // Admin/TeamLead access
        if (pathname.startsWith("/admin")) {
            if (role === "admin" || role === "teamlead") {
                return NextResponse.next();
            }
            console.log(`Middleware Denied Admin: role=${role}, path=${pathname}`);
            return NextResponse.redirect(new URL("/employee", request.url));
        }

        // Employee access
        if (pathname.startsWith("/employee")) {
            if (role === "employee" || role === "admin" || role === "teamlead") {
                return NextResponse.next();
            }
            console.log(`Middleware Denied Employee: role=${role}, path=${pathname}`);
            return NextResponse.redirect(new URL("/admin", request.url));
        }

        return NextResponse.next();
    } catch (error) {
        console.error("Middleware Error:", error);
        return NextResponse.redirect(new URL("/", request.url));
    }
}

export const config = {
    matcher: ["/admin/:path*", "/employee/:path*"],
};

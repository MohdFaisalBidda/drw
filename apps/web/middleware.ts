import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Get token from cookies
  const token = req.cookies.get("token")?.value;

  // If no token and accessing a protected route, redirect to sign-in
  if (!token && req.nextUrl.pathname !== "/sign-in") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }else if(token && req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up"){
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Apply middleware to protected routes
export const config = {
  matcher: ["/", "/draw/:path*", "/create-room","/sign-in","/sign-up"], // Apply to these routes
};

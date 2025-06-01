// import { getToken } from "next-auth/jwt";
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// const secret = process.env.NEXTAUTH_SECRET!;

// export async function middleware(req: NextRequest) {
//   try {
//     // Get token from cookies
//     console.log(secret, "secret in middleware");    
//     const token = await getToken({ req, secret: secret });

//     // If no token and accessing a protected route, redirect to sign-in
//     if (!token) {
//       if (req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up") {
//         // Allow access to sign-in and sign-up
//         return NextResponse.next();
//       }
//       // Redirect to sign-in for protected routes
//       return NextResponse.redirect(new URL("/sign-in", req.url));
//     }

//     // If token exists
//     if (token) {
//       if (req.nextUrl.pathname === "/sign-in" || req.nextUrl.pathname === "/sign-up") {
//         // Redirect to home if trying to access sign-in or sign-up
//         return NextResponse.redirect(new URL("/", req.url));
//       }
//     }

//     // Allow access to other routes
//     return NextResponse.next();
//   } catch (error) {
//     console.error("❌ Middleware Error:", error);
//     return new NextResponse("Internal Server Error", { status: 500 });
//   }
// }

// // Apply middleware to protected routes
// export const config = {
//   matcher: ["/", "/draw/:path*", "/create-room", "/sign-in", "/sign-up"], // Apply to these routes
// };

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// Add paths that should be protected
const protectedPaths = ["/chatal", "/chatqal"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if the path should be protected
  const isProtectedPath = protectedPaths.some((protectedPath) =>
    path.startsWith(protectedPath)
  );

  if (isProtectedPath) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      console.log("No token found in cookies");
      return NextResponse.redirect(new URL("/", request.url));
    }

    try {
      // Use jose for JWT verification
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      console.log("Token verified successfully:");
      return NextResponse.next();
    } catch (error) {
      console.error("Token verification failed:", error);
      // Clear the invalid token
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.set({
        name: "token",
        value: "",
        expires: new Date(0),
        path: "/",
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

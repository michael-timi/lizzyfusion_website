import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const logIncoming =
  process.env.NODE_ENV === "development" || process.env.LOG_INCOMING_REQUESTS === "1";

export function proxy(request: NextRequest) {
  if (logIncoming) {
    const path = request.nextUrl.pathname + request.nextUrl.search;
    console.log(`[incoming] ${request.method} ${path}`);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Skip static assets and Next internals; log page and API traffic only.
     */
    "/((?!_next/static|_next/image|icon\\.png|apple-icon\\.png|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot)$).*)",
  ],
};

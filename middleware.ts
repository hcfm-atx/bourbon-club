export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/meetings/:path*", "/polls/:path*", "/bourbons/:path*", "/ratings/:path*", "/payments/:path*", "/profile/:path*", "/admin/:path*", "/onboarding/:path*"],
};

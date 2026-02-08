import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      systemRole: "USER" | "SUPER_ADMIN";
      currentClubId: string | null;
      clubRole: "ADMIN" | "MEMBER" | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    systemRole: "USER" | "SUPER_ADMIN";
    currentClubId: string | null;
    clubRole: "ADMIN" | "MEMBER" | null;
  }
}

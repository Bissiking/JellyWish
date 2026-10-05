import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      /** Id interne JellyWish */
      id: string;
      /** `sub` OIDC Kyros */
      sub: string;
      roles: string[];
    } & DefaultSession["user"];
  }

  interface User {
    sub?: string;
    givenName?: string | null;
    familyName?: string | null;
    nickname?: string | null;
    roles?: string[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    uid?: string;
    roles?: string[];
  }
}

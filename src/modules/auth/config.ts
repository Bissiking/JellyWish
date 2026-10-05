import type { NextAuthConfig } from "next-auth";

/**
 * Configuration de base, sans provider ni accès base de données :
 * elle est importée par le proxy (protection des routes) et par
 * l'instance complète de NextAuth.
 */
export const authConfig = {
  trustHost: true,
  providers: [],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/signin",
    error: "/signin",
  },
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;

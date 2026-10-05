import NextAuth from "next-auth";
import { authConfig } from "@/modules/auth/config";

/**
 * Protection des routes (ex-middleware, renommé `proxy` en Next.js 16).
 * Seule la session est vérifiée ici : aucun accès base de données,
 * les permissions sont contrôlées côté serveur dans les pages et API.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    /*
     * Tout sauf :
     *  - les callbacks et endpoints d'authentification
     *  - les assets statiques et la compilation Next
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

import NextAuth from "next-auth";
import { authConfig } from "@/modules/auth/config";
import { kyros, type KyrosUser } from "@/modules/auth/kyros";
import { provisionKyrosUser } from "@/modules/auth/provision";

/**
 * Instance NextAuth complète (utilisée par la Route Handler d'authentification
 * et par les Server Components). Contrairement au proxy, elle a accès à la base.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [kyros()],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      if (account?.provider === "kyros" && user) {
        const kyrosUser = user as KyrosUser;
        const dbUser = await provisionKyrosUser(kyrosUser);
        token.uid = dbUser.id;
        token.sub = kyrosUser.sub;
        token.roles = dbUser.roles;
        token.name = dbUser.name;
        token.email = dbUser.email ?? undefined;
        token.picture = dbUser.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid ?? token.sub ?? "";
      session.user.sub = token.sub ?? "";
      session.user.roles = token.roles ?? [];
      return session;
    },
  },
});

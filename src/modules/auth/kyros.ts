import type { OIDCConfig } from "@auth/core/providers/oauth";
import { env } from "@/lib/env";
import { normalizeRoles, type KyrosProfile } from "@/modules/auth/kyros-profile";

/** Profil enrichi transporté du provider jusqu'au callback `jwt`. */
export type KyrosUser = {
  id: string;
  sub: string;
  name: string | null;
  givenName: string | null;
  familyName: string | null;
  nickname: string | null;
  email: string | null;
  image: string | null;
  roles: string[];
};

/**
 * Provider Kyros OIDC v1.
 * https://kyros.mhemery.fr/docs/oidc-v1.md
 *
 * - flux `authorization_code` + PKCE S256 et `state` ;
 * - scopes `openid profile email roles` ;
 * - `idToken: false` → Auth.js interroge `/userinfo`, c'est là que les scopes
 *   (notamment `roles`) sont matérialisés.
 */
export function kyros(): OIDCConfig<KyrosProfile> {
  const e = env();
  const issuer = e.KYROS_ISSUER.replace(/\/$/, "");

  return {
    id: "kyros",
    name: "Kyros",
    type: "oidc",
    issuer,
    wellKnown: `${issuer}/.well-known/openid-configuration`,
    clientId: e.KYROS_CLIENT_ID,
    clientSecret: e.KYROS_CLIENT_SECRET,
    authorization: {
      params: {
        scope: "openid profile email roles",
      },
    },
    checks: ["pkce", "state"],
    idToken: false,
    client: {
      token_endpoint_auth_method: "client_secret_basic",
    },
    profile(profile): KyrosUser {
      return {
        id: profile.sub,
        sub: profile.sub,
        name: profile.name ?? null,
        givenName: profile.given_name ?? null,
        familyName: profile.family_name ?? null,
        nickname: profile.nickname ?? profile.preferred_username ?? null,
        email: profile.email ?? null,
        image: profile.picture ?? null,
        roles: normalizeRoles(profile.roles),
      };
    },
  };
}

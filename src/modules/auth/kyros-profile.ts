export type KyrosProfile = {
  sub: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  /** Claim `roles` : Kyros peut renvoyer un tableau ou une chaîne séparée par des espaces */
  roles?: string[] | string;
};

export function normalizeRoles(raw: KyrosProfile["roles"]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.flatMap((r) => String(r).split(/\s+/)).filter(Boolean);
  return String(raw)
    .split(/[\s,]+/)
    .filter(Boolean);
}

import { db } from "@/lib/db";
import type { KyrosUser } from "@/modules/auth/kyros";

/**
 * Crée ou met à jour le profil interne JellyWish à partir des informations
 * Kyros. Les rôles Kyros sont rafraîchis à chaque connexion et miroités
 * dans `RoleMapping` ; les accès durables sont gérés par `RolePermission`
 * et `UserPermission`.
 */
export async function provisionKyrosUser(input: KyrosUser) {
  const now = new Date();

  const existing = await db.user.findUnique({
    where: { subject: input.sub },
    include: { roleMappings: { select: { role: true } } },
  });

  const data = {
    email: input.email,
    name: input.name,
    givenName: input.givenName,
    familyName: input.familyName,
    nickname: input.nickname,
    avatarUrl: input.image,
    roles: input.roles,
    lastLoginAt: now,
    isFirstLogin: existing?.isFirstLogin ?? true,
  };

  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: { ...data, isFirstLogin: false } })
    : await db.user.create({ data: { ...data, subject: input.sub, isFirstLogin: false } });

  const previous = new Set((existing?.roleMappings ?? []).map((r) => r.role));
  const next = new Set(input.roles);

  const toAdd = [...next].filter((r) => !previous.has(r));
  const toRemove = [...previous].filter((r) => !next.has(r));

  if (toAdd.length || toRemove.length) {
    await db.$transaction([
      ...(toAdd.length
        ? [
            db.roleMapping.createMany({
              data: toAdd.map((role) => ({ userId: user.id, role })),
              skipDuplicates: true,
            }),
          ]
        : []),
      ...(toRemove.length
        ? [
            db.roleMapping.deleteMany({
              where: { userId: user.id, role: { in: toRemove } },
            }),
          ]
        : []),
    ]);
  }

  if (existing) {
    await db.auditLog.create({
      data: {
        actorUserId: user.id,
        action: "auth.login",
        metadata: { roles: input.roles, rolesChanged: toAdd.length + toRemove.length > 0 },
      },
    });
  }

  return user;
}

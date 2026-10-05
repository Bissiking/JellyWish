import { cache } from "react";
import { db } from "@/lib/db";
import { PERMISSION_KEYS, type PermissionKey } from "@/modules/permissions/catalog";

export type Identity = {
  /** `sub` OIDC Kyros */
  subject: string;
  roles: string[];
};

export type PermissionSet = ReadonlySet<string>;

/**
 * Résout l'ensemble des permissions d'un utilisateur :
 *   permissions des rôles Kyros (RolePermission) ∪/- overrides individuels (UserPermission)
 * Mémoïsée par requête React (une seule lecture base par render).
 */
export const resolvePermissions = cache(async (identity: Identity): Promise<PermissionSet> => {
  const user = await db.user.findUnique({
    where: { subject: identity.subject },
    select: {
      isActive: true,
      roles: true,
      roleMappings: { select: { role: true } },
      userPermissions: { select: { permissionKey: true, granted: true } },
    },
  });

  if (!user || !user.isActive) {
    return new Set();
  }

  const roles = new Set([...identity.roles, ...user.roleMappings.map((m) => m.role)]);
  const keys = [...roles, ...(user.userPermissions.map((p) => p.permissionKey) as string[])];

  const rolePerms = keys.length
    ? await db.rolePermission.findMany({
        where: { role: { in: [...roles] } },
        select: { permissionKey: true },
      })
    : [];

  const granted = new Set<string>(rolePerms.map((p) => p.permissionKey));

  // Overrides individuels : ils priment sur les rôles, dans les deux sens.
  for (const override of user.userPermissions) {
    if (override.granted) {
      granted.add(override.permissionKey);
    } else {
      granted.delete(override.permissionKey);
    }
  }

  return granted;
});

export async function can(identity: Identity, permission: PermissionKey): Promise<boolean> {
  const set = await resolvePermissions(identity);
  return set.has(permission) || set.has("admin");
}

export async function canAll(identity: Identity, permissions: PermissionKey[]): Promise<boolean> {
  const set = await resolvePermissions(identity);
  return permissions.every((p) => set.has(p) || set.has("admin"));
}

/** Renvoie les permissions réellement accordées, pour l'UI. */
export async function grantedPermissions(identity: Identity): Promise<string[]> {
  const set = await resolvePermissions(identity);
  return PERMISSION_KEYS.filter((k) => set.has(k));
}

export class PermissionError extends Error {
  readonly code = "FORBIDDEN";
  constructor(readonly permission: PermissionKey) {
    super(`Permission requise : ${permission}`);
  }
}

export async function requirePermission(identity: Identity, permission: PermissionKey): Promise<void> {
  if (!(await can(identity, permission))) {
    throw new PermissionError(permission);
  }
}

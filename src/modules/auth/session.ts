import { redirect } from "next/navigation";
import { auth } from "@/modules/auth";
import { requirePermission as checkPermission, type Identity } from "@/modules/permissions";
import type { PermissionKey } from "@/modules/permissions/catalog";

/** Identité courante, ou null si non connecté. */
export async function getIdentity(): Promise<Identity | null> {
  const session = await auth();
  if (!session?.user?.sub) return null;
  return { subject: session.user.sub, roles: session.user.roles };
}

/** Identité obligatoire : redirige vers la page de connexion. */
export async function requireIdentity(): Promise<Identity> {
  const identity = await getIdentity();
  if (!identity) redirect("/signin");
  return identity;
}

/** Comme `requireIdentity` mais renvoie la session complète. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.sub) redirect("/signin");
  return session;
}

/** Vérifie une permission, sinon redirige vers l'accès refusé. */
export async function requirePermission(permission: PermissionKey): Promise<Identity> {
  const identity = await requireIdentity();
  await checkPermission(identity, permission);
  return identity;
}

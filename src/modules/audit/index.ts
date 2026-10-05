import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export type AuditEntry = {
  actorUserId?: string | null;
  action: string;
  target?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

/** Journalise une action administrative (ou sensible) — ne doit jamais throw. */
export async function audit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorUserId: entry.actorUserId ?? null,
        action: entry.action,
        target: entry.target ?? null,
        metadata: (entry.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        ip: entry.ip ?? null,
      },
    });
  } catch (error) {
    console.error("[audit] échec de journalisation", error);
  }
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { PermissionError, requirePermission as check, type Identity } from "@/modules/permissions";
import type { PermissionKey } from "@/modules/permissions/catalog";

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const unauthorized = () => new HttpError(401, "UNAUTHORIZED", "Authentification requise");
export const forbidden = (permission?: string) =>
  new HttpError(403, "FORBIDDEN", permission ? `Permission requise : ${permission}` : "Accès refusé");
export const notFound = (resource = "Ressource") => new HttpError(404, "NOT_FOUND", `${resource} introuvable`);
export const badRequest = (message: string) => new HttpError(400, "BAD_REQUEST", message);
export const conflict = (message: string) => new HttpError(409, "CONFLICT", message);

/** Normalise toute erreur en réponse JSON structurée. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Données invalides", issues: error.issues } },
      { status: 400 },
    );
  }
  if (error instanceof PermissionError) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: error.message, permission: error.permission } },
      { status: 403 },
    );
  }
  if (error instanceof HttpError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  console.error("[api] erreur non gérée", error);
  return NextResponse.json(
    { error: { code: "INTERNAL", message: "Erreur interne" } },
    { status: 500 },
  );
}

/** Enveloppe standard d'un Route Handler : capture l'erreur et la sérialise. */
export function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch((error) => errorResponse(error));
}

/** Exige une session, puis une permission. */
export async function requireApiPermission(
  identity: Identity | null,
  permission: PermissionKey,
): Promise<Identity> {
  if (!identity) throw unauthorized();
  await check(identity, permission);
  return identity;
}

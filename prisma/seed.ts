import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { PERMISSIONS } from "../src/modules/permissions/catalog";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

/** Rôles Kyros → permissions accordées au démarrage. */
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: PERMISSIONS.map((p) => p.key),
  user: [
    "request.movie",
    "request.series",
    "request.autoApprove.movie",
    "request.autoApprove.series",
    "request.manageOwn",
  ],
};

const DEFAULT_INTEGRATIONS = [
  { kind: "KYROS" as const, label: "Kyros OIDC", settings: {} },
  { kind: "TMDB" as const, label: "TMDB", settings: {} },
  { kind: "JELLYFIN" as const, label: "Jellyfin", settings: {} },
  { kind: "RADARR" as const, label: "Radarr", settings: {} },
  { kind: "SONARR" as const, label: "Sonarr", settings: {} },
  { kind: "GOTIFY" as const, label: "Gotify", settings: {} },
  { kind: "QBITTORRENT" as const, label: "qBittorrent", settings: {} },
] as const;

async function main() {
  for (const permission of PERMISSIONS) {
    await db.permission.upsert({
      where: { key: permission.key },
      update: { description: permission.description, category: permission.category },
      create: { key: permission.key, description: permission.description, category: permission.category },
    });
  }

  for (const [role, keys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    for (const permissionKey of keys) {
      await db.rolePermission.upsert({
        where: { role_permissionKey: { role, permissionKey } },
        update: {},
        create: { role, permissionKey },
      });
    }
  }

  for (const integration of DEFAULT_INTEGRATIONS) {
    await db.integration.upsert({
      where: { kind: integration.kind },
      update: {},
      create: { kind: integration.kind, label: integration.label, settings: integration.settings },
    });
  }

  await db.setting.upsert({
    where: { key: "setup.completed" },
    update: {},
    create: { key: "setup.completed", value: false },
  });

  console.log("Seed terminé : permissions, rôles, intégrations, paramètres.");
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });

Frontend + backend web : Next.js 16 + TypeScript
UI : Tailwind CSS + shadcn/ui
BDD : PostgreSQL
ORM : Prisma
Auth : Auth.js / NextAuth compatible OIDC, avec provider Kyros custom si besoin
Validation : Zod
Jobs / workflows : BullMQ + Redis si on veut quelque chose de robuste
API internes : Route Handlers Next.js, pas besoin de Fastify au début
TMDB / Radarr / Sonarr / Jellyfin / Gotify / qBittorrent : clients TypeScript dédiés
Tests : Vitest + Playwright
Objective
- Construire l'application JellyWish (portail de demandes de films/séries pour l'écosystème LUMA) de zéro dans D:\DEV\NODEJS\JellyWish, en suivant les specs de DOCS\PROMPT.md et DOCS\Techno.md.
- Premier jalon : structure, PostgreSQL (Docker), auth OIDC Kyros, permissions, layout/identité, puis TMDB et le reste du workflow.
Important Details
- Stack imposée (DOCS\Techno.md) : Next.js 16 + TypeScript, Tailwind + shadcn/ui, PostgreSQL, Prisma, Auth.js/NextAuth (provider Kyros custom), Zod, BullMQ + Redis, Route Handlers Next.js, clients TS dédiés (TMDB/Radarr/Sonarr/Jellyfin/Gotify/qBittorrent), tests Vitest + Playwright.
- Versions installées : next@16.3.8, react@19.2.8, prisma@7.10.0 + @prisma/client@7.10.0 (stable, éviter le tag latest 8.0.0-rc), next-auth@5.0.0-beta.32, zod, @prisma/adapter-pg, pg, dotenv, @types/pg.
- Auth : Kyros OIDC v1 uniquement (pas de compte local) — doc : https://kyros.mhemery.fr/docs/oidc-v1.md, issuer https://kyros.mhemery.fr, discovery /.well-known/openid-configuration, scopes openid profile email roles, client_secret_basic, PKCE S256, callback {APP_URL}/api/auth/callback/kyros.
- Env vars nommées selon PROMPT : KYROS_ISSUER, KYROS_CLIENT_ID, KYROS_CLIENT_SECRET, AUTH_SECRET, DATABASE_URL, TMDB_API_KEY, etc. .env gitignoré, .env.example commitable (ajout !.env.example dans .gitignore).
- Pas de oidc provider dans Auth.js v5 beta.32 → provider custom type: "oidc" typé OIDCConfig depuis @auth/core/providers/oauth (subpath ./providers/* existe), idToken: false pour passer par /userinfo.
- next-auth/middleware est un stub déprécié qui throw → utiliser NextAuth(authConfig).auth comme proxy.
- Next.js 16 : middleware → proxy (un seul export fonction proxy + export const config matcher), docs dans node_modules/next/dist/docs/, règle AGENTS.md : lire ces docs avant d'écrire du code.
- Prisma 7 : config prisma7.config.ts (chargé via dotenv/config), generator prisma-client → output TypeScript src/generated/prisma (gitignoré, npx prisma generate nécessaire), driver adapter obligatoire (PrismaPg), migrations dans prisma/migrations.
- Décisions d'archi : src/modules/<module>/ (auth, permissions, audit, tmdb, requests, rules, releases, radarr, sonarr, jellyfin, gotify, notifications, admin), session JWT (pas d'adapter Auth.js, User provisionné au sign-in), permissions résolues serveur via DB (RolePermission ∪/- UserPermission), RoleMapping = miroir des rôles Kyros resync à chaque login.
- 9 vulnérabilités npm (transitives dev deps : braces, fast-glob, mysql2, @prisma/config…) — non bloquantes, npm audit fix --force refusé pour l'instant.
- Docker dispo : containers jellywish-postgres (postgres:17-alpine, port 5432, user/mdp/db jellywish) et jellywish-redis (redis:7-alpine, port 6379) UP via docker-compose.yml.
- Projet scaffoldé via dossier temp C:\Users\mathe\AppData\Local\Temp\opencode\jellywish car create-next-app refuse un nom avec majuscules ; repo git existant conservé (commit 5c057c9 Initial commit).
Work State
Completed
- docker-compose.yml créé, docker compose up -d → postgres + redis UP.
- prisma/schema.prisma complet rédigé : User, RoleMapping, Permission, RolePermission, UserPermission, Request, RequestItem, RequestStatusHistory, ApprovalRule, ApprovalRuleCondition, ReleaseRule, ReleaseRuleCondition, ReleaseCandidate, ReleaseDecision, Integration, IntegrationHealth, NotificationPreference, NotificationHistory, WorkflowTask, Setting, AuditLog ; enums MediaType, RequestStatus, DecisionOutcome, RuleResult, MatchMode, ReleaseAction, IntegrationKind, HealthStatus, NotificationEvent, TaskStatus. (modèle Session supprimé.)
- Migration appliquée : prisma\migrations\20261005145513_init\migration.sql ; npx prisma generate OK → src/generated/prisma.
- .env (secret AUTH_SECRET=xltrdTo7zDAS1koTAthyYpYEYatIqI7UsHWyVwGWXH4) et .env.example écrits.
- Fichiers créés :
- src/lib/env.ts (zod lazy env(), integrationConfigured())
- src/lib/db.ts (singleton db avec PrismaPg)
- src/lib/api.ts (HttpError, errorResponse, handle, requireApiPermission)
- src/modules/permissions/catalog.ts (10 permissions : request.movie, request.series, request.autoApprove.movie/series, request.4k, request.unlimited, request.manageOwn, requests.manageAll, settings.manage, admin)
- src/modules/permissions/index.ts (resolvePermissions (cache React), can, canAll, grantedPermissions, requirePermission, PermissionError)
- src/modules/auth/kyros-profile.ts (KyrosProfile, normalizeRoles)
- src/modules/auth/kyros.ts (kyros(): OIDCConfig, KyrosUser)
- src/modules/auth/config.ts (authConfig sans provider/DB, pages.signIn: "/signin", authorized callback)
- src/modules/auth/provision.ts (provisionKyrosUser : upsert user + sync RoleMapping + audit auth.login)
- src/modules/auth/index.ts (NextAuth complet : callbacks jwt (provision) et session (id/sub/roles))
- src/modules/auth/session.ts (getIdentity, requireIdentity, requireSession, requirePermission → redirect)
- src/modules/audit/index.ts (audit())
- src/types/next-auth.d.ts (augmentation Session/User/JWT)
- src/app/api/auth/[...nextauth]/route.ts (GET, POST depuis handlers)
- Dossiers Prisma inutiles supprimés (.claude, .windsurf ; .agents/skills conservé).
Active
- Écriture de src/proxy.ts : instance NextAuth(authConfig).auth exposée en export const proxy + export const config (matcher excluant /api/auth, /_next, statiques, /signin), puis vérification du comportement de redirection de l'authorized callback dans @auth/core/next-auth/index.js.
- Todo list actuelle : (1) scaffold Next.js ✅ en cours→fait, (2) PG+Prisma ✅, (3) auth Kyros + permissions 🔶, (4) layout/identité JellyWish, (5) TMDB, (6) Jellyfin, (7) demandes + timeline, (8) Radarr/Sonarr, (9) règles d'approbation, (10) sélection de releases, (11) jobs/Gotify/admin, (12) lint+typecheck+build verts.
Blocked
- Pas d'accès réel aux identifiants Kyros (KYROS_CLIENT_ID/SECRET vides) → flux OIDC non testable en bout à bout ; structure de claim roles (tableau vs chaîne) supposée, gérée par normalizeRoles.
- npx prisma migrate dev a besoin de Docker UP (fait).
Next Move
1. Créer src/proxy.ts (export proxy = NextAuth(authConfig).auth, config.matcher protégeant tout sauf /api/auth/*, /signin, statiques) et vérifier dans node_modules/next-auth/index.js / @auth/core que authorized → false redirige bien vers /signin.
2. Lancer npm run lint + npx tsc --noEmit + npm run build pour valider l'ossature, puis enchaîner sur la page /signin, le layout + navigation basé sur les permissions, et le seed des permissions (prisma/seed.ts : upsert Permission + RolePermission admin).
Relevant Files
- D:\DEV\NODEJS\JellyWish\DOCS\PROMPT.md : spec complète (flux, permissions §3, modèle §19, dossier modules §20, API §22, conventions §25).
- D:\DEV\NODEJS\JellyWish\DOCS\Techno.md : stack imposée.
- D:\DEV\NODEJS\JellyWish\prisma\schema.prisma : schéma DB source de vérité.
- D:\DEV\NODEJS\JellyWish\prisma7.config.ts : config Prisma 7 (schema, migrations, datasource).
- D:\DEV\NODEJS\JellyWish\docker-compose.yml : postgres:17-alpine + redis:7-alpine.
- D:\DEV\NODEJS\JellyWish\.env / .env.example : variables (secrets jamais commités).
- D:\DEV\NODEJS\JellyWish\src\modules\auth\ : config.ts, index.ts, kyros.ts, kyros-profile.ts, provision.ts, session.ts.
- D:\DEV\NODEJS\JellyWish\src\modules\permissions\ : catalog.ts, index.ts.
- D:\DEV\NODEJS\JellyWish\src\lib\ : env.ts, db.ts, api.ts.
- D:\DEV\NODEJS\JellyWish\src\types\next-auth.d.ts : augmentation des types de session.
- D:\DEV\NODEJS\JellyWish\src\proxy.ts : à créer (protection des routes, Next 16).
- D:\DEV\NODEJS\JellyWish\node_modules\next\dist\docs\ : docs Next 16 obligatoires avant code.
- D:\DEV\NODEJS\JellyWish\AGENTS.md : avertissement breaking changes Next 16, régénéré par next dev.
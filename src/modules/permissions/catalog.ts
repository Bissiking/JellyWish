/**
 * Catalogue des permissions JellyWish.
 * Source unique de vérité : la base référence ces clés, l'UI ne doit
 * jamais tester une permission en dur dans un composant.
 */
export const PERMISSIONS = [
  { key: "request.movie", description: "Demander un film", category: "requests" },
  { key: "request.series", description: "Demander une série", category: "requests" },

  { key: "request.autoApprove.movie", description: "Auto-approuver ses demandes de film", category: "requests" },
  { key: "request.autoApprove.series", description: "Auto-approuver ses demandes de série", category: "requests" },

  { key: "request.4k", description: "Demander du contenu 4K", category: "requests" },
  { key: "request.unlimited", description: "Demandes illimitées (pas de quota)", category: "requests" },
  { key: "request.manageOwn", description: "Modifier / annuler ses propres demandes", category: "requests" },
  { key: "requests.manageAll", description: "Gérer toutes les demandes", category: "requests" },

  { key: "settings.manage", description: "Configurer JellyWish et les intégrations", category: "admin" },
  { key: "admin", description: "Administration complète", category: "admin" },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key) as PermissionKey[];

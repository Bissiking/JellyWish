import { z } from "zod";

/**
 * Variables d'environnement validées.
 * Lecture paresseuse : le parsing n'a lieu qu'à la première utilisation,
 * ce qui évite de planter le build quand une variable manque encore.
 */
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_URL: z.string().url().default("http://localhost:3000"),
  AUTH_SECRET: z.string().min(16),

  KYROS_ISSUER: z.string().url().default("https://kyros.mhemery.fr"),
  KYROS_CLIENT_ID: z.string().optional().default(""),
  KYROS_CLIENT_SECRET: z.string().optional().default(""),

  TMDB_API_KEY: z.string().optional().default(""),
  TMDB_LANGUAGE: z.string().optional().default("fr-FR"),

  JELLYFIN_URL: z.string().optional().default(""),
  JELLYFIN_API_KEY: z.string().optional().default(""),

  RADARR_URL: z.string().optional().default(""),
  RADARR_API_KEY: z.string().optional().default(""),

  SONARR_URL: z.string().optional().default(""),
  SONARR_API_KEY: z.string().optional().default(""),

  GOTIFY_URL: z.string().optional().default("https://notify.mhemery.fr"),
  GOTIFY_TOKEN: z.string().optional().default(""),

  QBITTORRENT_URL: z.string().optional().default(""),
  QBITTORRENT_USERNAME: z.string().optional().default(""),
  QBITTORRENT_PASSWORD: z.string().optional().default(""),

  REDIS_URL: z.string().optional().default("redis://localhost:6379"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    cached = schema.parse(process.env);
  }
  return cached;
}

/** Intégrations dont la configuration est jugée complète. */
export function integrationConfigured(kind: "tmdb" | "jellyfin" | "radarr" | "sonarr" | "gotify" | "qbittorrent") {
  const e = env();
  switch (kind) {
    case "tmdb":
      return e.TMDB_API_KEY.length > 0;
    case "jellyfin":
      return e.JELLYFIN_URL.length > 0 && e.JELLYFIN_API_KEY.length > 0;
    case "radarr":
      return e.RADARR_URL.length > 0 && e.RADARR_API_KEY.length > 0;
    case "sonarr":
      return e.SONARR_URL.length > 0 && e.SONARR_API_KEY.length > 0;
    case "gotify":
      return e.GOTIFY_TOKEN.length > 0;
    case "qbittorrent":
      return e.QBITTORRENT_URL.length > 0;
  }
}

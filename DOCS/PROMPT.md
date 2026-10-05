# Projet : JellyWish

Créer une nouvelle application web nommée **JellyWish**.

JellyWish est un portail de demandes de films et séries pour l’écosystème LUMA.

L’objectif est de proposer une expérience proche de Jellyseerr, mais avec une architecture conçue autour de **Kyros OIDC**, **Radarr**, **Sonarr**, **Jellyfin**, **Gotify** et éventuellement du client torrent.

Le projet doit être conçu proprement, de manière modulaire et maintenable.

## 1. Objectif principal

Un utilisateur se connecte via Kyros.

Il peut :

- rechercher un film ou une série ;
- consulter sa fiche ;
- voir si le contenu est déjà présent dans Jellyfin ;
- effectuer une demande ;
- suivre toute la progression de cette demande ;
- recevoir une notification lorsque le contenu est disponible.

JellyWish doit prendre en charge deux niveaux de décision :

1. décider si une demande est autorisée ;
2. décider quelle release peut être téléchargée.

L’application doit fonctionner comme un orchestrateur.

Flux global :

```text
Kyros
↓
JellyWish
↓
TMDB / métadonnées
↓
Moteur de règles d'approbation
↓
Radarr / Sonarr
↓
Recherche de releases
↓
Moteur de sélection des releases
↓
Grab contrôlé
↓
Client torrent
↓
Import Radarr / Sonarr
↓
Jellyfin
↓
Gotify
```

## 2. Authentification

L'authentification doit utiliser exclusivement **Kyros OIDC v1**.

Ne pas implémenter de compte local avec mot de passe.

Utiliser notamment :

```text
openid
profile
email
roles
```

Prévoir la récupération de :

- subject OIDC ;
- nom ;
- prénom si disponible ;
- pseudonyme ;
- email ;
- avatar ;
- rôles.

Créer automatiquement le profil interne JellyWish lors de la première connexion.

Les permissions doivent pouvoir dépendre des rôles provenant de Kyros.

## 3. Rôles et permissions

Prévoir un système de permissions extensible.

Exemples :

```text
request.movie
request.series

request.autoApprove.movie
request.autoApprove.series

request.4k

request.unlimited

request.manageOwn

requests.manageAll

settings.manage

admin
```

Ne pas coder les permissions directement dans les composants UI.

Créer une vraie couche d'autorisation centralisée.

## 4. Recherche de contenu

Utiliser **TMDB** comme source principale de métadonnées.

Permettre :

- recherche globale ;
- films ;
- séries ;
- tendances ;
- nouveautés ;
- contenus populaires.

Afficher au minimum :

- titre ;
- titre original ;
- affiche ;
- backdrop ;
- année ;
- synopsis ;
- genres ;
- note ;
- nombre de votes ;
- durée ;
- date de sortie ;
- statut ;
- classification si disponible.

Pour les séries :

- saisons ;
- nombre d'épisodes ;
- statut de diffusion ;
- prochaine diffusion si disponible.

## 5. Vérification Jellyfin

Avant toute demande, vérifier si le média est déjà présent dans Jellyfin.

Afficher des états clairement distincts :

```text
Disponible
Partiellement disponible
Demandé
En attente d'approbation
Approuvé
Recherche en cours
Release sélectionnée
Téléchargement
Import en cours
Disponible
Refusé
Erreur
```

Pour une série, prendre en compte les saisons disponibles individuellement.

## 6. Demandes

### Films

L'utilisateur peut demander un film.

### Séries

L'utilisateur peut demander :

- toute la série ;
- une ou plusieurs saisons ;
- les saisons manquantes.

Prévoir l'architecture pour permettre plus tard de demander automatiquement les futures saisons.

## 7. Moteur de règles d'approbation

Créer un moteur de règles configurable depuis l'administration.

Une demande peut produire trois résultats :

```text
AUTO_APPROVED
REVIEW_REQUIRED
AUTO_REJECTED
```

Les règles doivent pouvoir utiliser plusieurs conditions.

Exemples :

### Utilisateur

- utilisateur ;
- rôle Kyros ;
- nombre de demandes récentes ;
- quota ;
- demandes actuellement actives.

### Média

- film ou série ;
- genre ;
- année ;
- date de sortie ;
- disponible ou non en numérique ;
- note TMDB ;
- nombre minimum de votes ;
- popularité ;
- classification ;
- statut.

### Qualité

- 720p ;
- 1080p ;
- 2160p ;
- WEB-DL ;
- BluRay ;
- Remux.

### Infrastructure

- espace disque disponible ;
- nombre de téléchargements actifs ;
- stockage cible ;
- état de Radarr/Sonarr ;
- état du client torrent.

### Exemple

```text
SI
type = movie
ET qualité <= 1080p
ET date de sortie > 30 jours
ET note >= 5
ET votes >= 100
ET espace libre >= 500 Go

ALORS
AUTO_APPROVED
```

Autre exemple :

```text
SI
qualité = 2160p
OU taille estimée > 50 Go

ALORS
REVIEW_REQUIRED
```

Les règles doivent être ordonnées par priorité.

Prévoir :

- activation/désactivation ;
- priorité ;
- opérateurs AND / OR ;
- conditions ;
- résultat ;
- explication.

Pour chaque demande, enregistrer pourquoi elle a été approuvée, refusée ou placée en validation manuelle.

## 8. Intégration Radarr / Sonarr

Point extrêmement important :

### JellyWish ne doit PAS laisser Radarr ou Sonarr lancer automatiquement une recherche lors de l'ajout d'un média.

Workflow :

```text
Demande approuvée
↓
Ajout du média dans Radarr ou Sonarr
↓
Aucune recherche automatique
↓
JellyWish demande explicitement les releases disponibles
↓
Analyse des releases
↓
Sélection
↓
Grab explicite
```

Radarr et Sonarr doivent rester responsables de :

- gestion du média ;
- communication avec les indexers ;
- communication avec le client de téléchargement ;
- suivi du téléchargement ;
- import ;
- renommage ;
- déplacement ou hardlink.

JellyWish ne remplace pas Radarr ou Sonarr.

## 9. Recherche des releases

Une fois la demande approuvée, JellyWish demande les releases disponibles à Radarr ou Sonarr.

Récupérer autant que possible :

- titre de release ;
- indexer ;
- protocole ;
- seeders ;
- leechers ;
- taille ;
- qualité ;
- résolution ;
- source ;
- codec vidéo ;
- codec audio ;
- HDR ;
- Dolby Vision ;
- langue ;
- score ;
- Custom Formats ;
- raison éventuelle de rejet par Radarr/Sonarr.

Afficher ces informations dans l'administration.

## 10. Moteur de sélection de release

Créer un second moteur de règles spécifique aux releases.

Exemple :

```text
résolution = 1080p
taille <= 25 Go
seeders >= 10
langue = FR OU MULTI
codec != AV1
```

Résultat :

```text
ACCEPT
REJECT
PREFER
```

Le moteur doit permettre de classer les releases éligibles.

Sélectionner automatiquement la meilleure release autorisée.

Ne déclencher le téléchargement qu'après cette sélection.

Conserver la justification du choix.

Exemple :

```text
Release choisie :
Dune.Part.Two.2024.1080p.WEB-DL...

Raisons :
+ résolution préférée
+ MULTI
+ 125 seeders
+ taille acceptable
+ score Custom Format élevé
```

## 11. Grab

Après sélection, demander explicitement à Radarr ou Sonarr de grab la release choisie.

Ne pas envoyer directement le torrent au client depuis JellyWish si ce n'est pas nécessaire.

Radarr/Sonarr restent le point central du workflow de téléchargement.

## 12. Client torrent

Prévoir une intégration optionnelle directe avec le client torrent.

Première cible possible :

**qBittorrent**.

Cette intégration sert principalement à la supervision.

Récupérer :

- progression ;
- statut ;
- taille ;
- téléchargé ;
- restant ;
- vitesse descendante ;
- vitesse montante ;
- ETA ;
- ratio ;
- seeders ;
- peers ;
- erreurs.

Ne pas faire de JellyWish un remplacement du système de download client de Radarr/Sonarr.

## 13. Suivi complet

La demande doit conserver une timeline.

Exemple :

```text
16:03 Demande créée

16:03 Analyse des règles

16:03 Auto-approuvée
Règle : Film 1080p standard

16:04 Ajout dans Radarr

16:04 Recherche de releases

16:05 18 releases trouvées

16:05 11 releases rejetées

16:05 Release sélectionnée
Dune.Part.Two.2024...

16:05 Grab envoyé à Radarr

16:06 Téléchargement démarré

16:25 53 %

16:43 Téléchargement terminé

16:44 Import Radarr

16:45 Détecté dans Jellyfin

16:45 Disponible
```

Cette timeline doit être persistée en base.

## 14. Notifications Gotify

Intégrer Gotify.

Instance :

```text
https://notify.mhemery.fr
```

Configuration via variables d'environnement.

Ne mettre aucun token directement dans le code.

Notifications possibles :

- demande reçue ;
- demande approuvée ;
- validation admin requise ;
- demande refusée ;
- aucune release trouvée ;
- téléchargement démarré ;
- téléchargement échoué ;
- import réussi ;
- média disponible dans Jellyfin.

Les notifications utilisateur doivent être configurables.

## 15. Interface utilisateur

Créer une UX moderne dans l'esprit des plateformes de streaming.

Accueil :

- hero ;
- tendances ;
- films populaires ;
- séries populaires ;
- nouveautés ;
- contenus récemment ajoutés à Jellyfin.

Recherche globale visible.

### Cartes

Afficher :

- poster ;
- titre ;
- année ;
- note ;
- état JellyWish/Jellyfin.

### Page média

Afficher :

- backdrop ;
- poster ;
- titre ;
- synopsis ;
- informations ;
- casting principal ;
- saisons ;
- état ;
- bouton de demande.

### Page Mes demandes

Afficher toutes les demandes de l'utilisateur.

Filtres :

```text
Toutes
En attente
Approuvées
Téléchargement
Disponibles
Refusées
Erreurs
```

Afficher la timeline détaillée.

## 16. Administration

Créer une vraie interface d'administration.

Sections :

```text
Dashboard
Demandes
Utilisateurs
Règles
Releases
Radarr
Sonarr
Jellyfin
Téléchargements
Gotify
Intégrations
Stockage
Logs
Paramètres
```

### Dashboard

Afficher :

- demandes aujourd'hui ;
- demandes en attente ;
- téléchargements actifs ;
- erreurs ;
- stockage disponible ;
- état Jellyfin ;
- état Radarr ;
- état Sonarr ;
- état qBittorrent ;
- état Gotify.

## 17. Validation manuelle

Une demande en `REVIEW_REQUIRED` doit apparaître dans une file.

L'administrateur peut :

```text
Approuver
Refuser
Modifier les paramètres
Choisir la qualité
Choisir le profil
Choisir la release
```

Lors d'un refus, permettre une raison.

La raison doit être visible par l'utilisateur.

## 18. Gestion des doublons

Avant chaque demande, vérifier :

- Jellyfin ;
- demandes JellyWish ;
- Radarr ;
- Sonarr.

Cas possibles :

### Déjà dans Jellyfin

Ne pas créer de nouvelle demande.

### Déjà demandé

Rattacher l'utilisateur à la demande existante.

### Déjà dans Radarr/Sonarr

Récupérer son état et créer un suivi JellyWish sans créer de doublon.

## 19. Base de données

Utiliser PostgreSQL.

Prévoir notamment les modèles :

```text
User
RoleMapping
Permission

Request
RequestItem
RequestStatusHistory

ApprovalRule
ApprovalRuleCondition

ReleaseRule
ReleaseRuleCondition

ReleaseCandidate
ReleaseDecision

Integration
IntegrationHealth

NotificationPreference
NotificationHistory

AuditLog
```

Prévoir de vraies migrations.

## 20. Architecture

Le code doit être modulaire.

Séparer clairement :

```text
auth
users
permissions
media
tmdb
requests
rules
releases
radarr
sonarr
jellyfin
download-client
gotify
notifications
admin
audit
```

Les intégrations externes doivent passer par des adapters/services.

Exemple :

```text
RadarrClient
SonarrClient
JellyfinClient
GotifyClient
QBitTorrentClient
TmdbClient
```

Ne pas appeler directement les API externes depuis les composants React.

## 21. Résilience

Une panne de Jellyfin, Radarr, Sonarr ou Gotify ne doit pas faire planter JellyWish.

Prévoir :

- timeout ;
- retry raisonnable ;
- erreurs structurées ;
- état de santé des intégrations ;
- logs ;
- reprise des workflows interrompus.

Les opérations importantes doivent être idempotentes.

## 22. Jobs

Prévoir un système de jobs pour :

- actualiser les demandes ;
- actualiser les téléchargements ;
- détecter les imports ;
- vérifier Jellyfin ;
- envoyer les notifications ;
- reprendre les opérations échouées.

Ne pas dépendre uniquement des requêtes HTTP utilisateur pour faire avancer les workflows.

## 23. Sécurité

Respecter les bonnes pratiques :

- secrets uniquement dans `.env` ;
- validation des entrées ;
- CSRF si nécessaire ;
- cookies sécurisés ;
- sessions sécurisées ;
- contrôle d'accès backend ;
- rate limiting ;
- protection des endpoints admin ;
- aucune confiance accordée uniquement au frontend ;
- journalisation des actions administrateur.

Ne jamais exposer :

- token Radarr ;
- token Sonarr ;
- token Jellyfin ;
- token Gotify ;
- identifiants qBittorrent.

## 24. Responsive

L'application doit fonctionner correctement sur :

- desktop ;
- tablette ;
- mobile.

L'expérience mobile doit être suffisamment propre pour pouvoir utiliser JellyWish comme portail principal depuis un téléphone.

## 25. Configuration

Créer un `.env.example` documenté.

Prévoir notamment :

```text
DATABASE_URL

APP_URL

KYROS_ISSUER
KYROS_CLIENT_ID
KYROS_CLIENT_SECRET

TMDB_API_KEY

JELLYFIN_URL
JELLYFIN_API_KEY

RADARR_URL
RADARR_API_KEY

SONARR_URL
SONARR_API_KEY

GOTIFY_URL
GOTIFY_TOKEN

QBITTORRENT_URL
QBITTORRENT_USERNAME
QBITTORRENT_PASSWORD
```

## 26. Setup initial

Lors du premier lancement, si aucune configuration n'existe, proposer un assistant.

Étapes :

```text
Bienvenue dans JellyWish

1. Base de données
2. Kyros
3. TMDB
4. Jellyfin
5. Radarr
6. Sonarr
7. Gotify
8. qBittorrent
9. Test des connexions
10. Terminer
```

Toutes les intégrations sauf Kyros et la base doivent pouvoir être facultatives pendant le développement.

## 27. Design

Nom :

**JellyWish**

Créer une identité visuelle sobre et moderne.

Ne pas recopier exactement Jellyseerr.

Inspiration générale :

- Jellyfin ;
- applications modernes de streaming ;
- interfaces LUMA.

Prévoir dark mode en priorité.

Interface claire avec peu de bruit visuel.

Les informations techniques concernant les releases doivent être masquées aux utilisateurs classiques et accessibles aux administrateurs.

## 28. Développement

Procéder progressivement.

Ne pas implémenter tout dans un seul fichier ou un énorme composant.

Commencer par :

```text
1. structure du projet
2. PostgreSQL
3. authentification Kyros
4. layout
5. TMDB
6. Jellyfin
7. système de demandes
8. Radarr/Sonarr
9. règles d'approbation
10. sélection des releases
11. téléchargement
12. Gotify
13. administration
```

À chaque étape :

- garder l'application compilable ;
- utiliser des types propres ;
- gérer les erreurs ;
- éviter les mocks permanents ;
- documenter les décisions importantes.

## 29. Documentation

Créer :

```text
README.md
docs/ARCHITECTURE.md
docs/INTEGRATIONS.md
docs/RULE_ENGINE.md
docs/INSTALLATION.md
```

Documenter les flux :

```text
Demande
→ Approbation
→ Ajout Radarr/Sonarr
→ Recherche
→ Sélection release
→ Grab
→ Download
→ Import
→ Jellyfin
→ Notification
```

## 30. Contraintes importantes

Ne pas :

- réimplémenter Radarr ;
- réimplémenter Sonarr ;
- créer un client torrent maison ;
- laisser Radarr/Sonarr lancer automatiquement la recherche au moment de l'ajout ;
- mélanger logique métier et composants UI ;
- mettre les secrets en dur ;
- considérer une demande terminée dès le début du téléchargement.

Une demande est considérée comme terminée uniquement lorsque JellyWish confirme que le contenu attendu est disponible dans Jellyfin.

Le but final est que JellyWish sache précisément où se trouve chaque demande dans toute la chaîne d'acquisition.

Construire une première version fonctionnelle avec une architecture suffisamment propre pour être ensuite auditée, corrigée et améliorée par un autre développeur ou agent.



PS: Docs OIDCv1: https://kyros.mhemery.fr/docs/oidc-v1.md
PSS: Skill impeccable disponible
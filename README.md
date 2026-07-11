# Core Solidity & EVM — Entraînement

Quiz d'entraînement interactif basé sur les 90 questions du guide de
certification *Cyfrin Solidity Smart Contract Developer (SSCD+)*, avec suivi
de progression au fil des sessions.

**Stack** : Nuxt 4 (Vue 3, TypeScript strict) · Drizzle ORM · PostgreSQL ·
Biome (lint + format).

## Pourquoi cette stack

Vue seul (SPA) ne peut pas parler à Postgres directement — Drizzle a besoin
d'un runtime serveur. Nuxt fournit cette couche serveur (Nitro) dans le même
projet : les composants Vue vivent dans `app/`, les routes API dans
`server/api/`, et le schéma + les requêtes Drizzle dans `server/db/`. Un seul
projet, un seul déploiement.

## Prérequis

- Node.js 20+
- Docker (pour Postgres en local) — ou un Postgres déjà accessible

## Démarrage

```bash
# 1. Dépendances
npm install

# 2. Config
cp .env.example .env
# adapte DATABASE_URL si besoin

# 3. Postgres en local
docker compose up -d

# 4. Schéma + données
npm run db:migrate   # crée les tables
npm run db:seed      # insère les 90 questions

# 5. Lancer
npm run dev           # http://localhost:3000
```

## Scripts

| Commande            | Effet                                                        |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Serveur de développement                                     |
| `npm run build`       | Build de production (`.output/`)                             |
| `npm run preview`     | Prévisualise le build de production en local                 |
| `npm run typecheck`   | Vérifie les types sur tout le projet (`app/` + `server/`)     |
| `npm run lint`        | Lint + vérifie le formatage (Biome)                           |
| `npm run lint:fix`    | Corrige automatiquement ce qui peut l'être                    |
| `npm run db:generate` | Génère une migration à partir de `server/db/schema.ts`        |
| `npm run db:migrate`  | Applique les migrations en attente                            |
| `npm run db:seed`     | (Ré)insère les 90 questions (idempotent, upsert sur `number`) |
| `npm run db:studio`   | Ouvre Drizzle Studio pour explorer la base                    |

## Modèle de données

Trois tables (`server/db/schema.ts`) :

- **`questions`** — les 90 questions (statique, remplie par `db:seed`).
- **`quiz_sessions`** — une session d'entraînement. `question_ids` fige
  l'ordre des questions tirées à la création, ce qui rend chaque session
  reprenable après un rechargement de page (le prochain onglet fermé/rouvert
  retombe exactement où tu en étais).
- **`session_answers`** — chaque réponse donnée, liée à une session et une
  question, avec le résultat (correct/incorrect).

Le tableau de bord (`/`) agrège ces données : score moyen, meilleur score,
précision globale, série de jours d'affilée, évolution des derniers scores,
et les questions sur lesquelles tu te trompes le plus souvent.

## Déploiement

Pas d'authentification (usage mono-utilisateur, comme demandé) — si l'app
est exposée publiquement, n'importe qui avec l'URL peut lancer des sessions
et voir la progression. Pour un usage personnel déployé en ligne, deux
options simples si tu veux la protéger :

- Protection au niveau de l'hébergeur (ex. Vercel Deployment Protection,
  Cloudflare Access).
- Un middleware Nitro avec Basic Auth (`server/middleware/`), à ajouter au
  besoin.

Pour la base de données en production, un Postgres managé fonctionne
directement avec la même variable `DATABASE_URL` (testé avec le driver
`postgres-js`, compatible Neon, Supabase, Railway, ou un Postgres
auto-hébergé). Pense à lancer `npm run db:migrate` puis `npm run db:seed`
une fois la base de prod branchée.

## Pistes d'évolution

- Génération de sessions ciblées sur les questions les plus ratées
  (le tableau de bord les identifie déjà via `/api/stats`).
- Filtrage par thème (proxies, gas, EVM bas niveau...) si tu veux réviser un
  sujet précis plutôt qu'un tirage aléatoire/séquentiel.

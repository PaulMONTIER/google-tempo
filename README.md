# 🤖 Tempo - AI Calendar Assistant

**Tempo** est un assistant de calendrier intelligent propulsé par **LangGraph** et **Gemini 2.5 Flash**, capable de gérer votre agenda Google Calendar de manière autonome grâce à une architecture **ReAct** (Reason + Act).

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![LangGraph](https://img.shields.io/badge/LangGraph-Agent-orange?style=flat-square)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-red?style=flat-square&logo=google)

---

## ✨ Fonctionnalités

### 🧠 Agent Intelligent (LangGraph + Gemini 2.5 Flash)
- **Boucle ReAct** : L'agent raisonne, appelle des outils, analyse les résultats et agit de manière autonome
- **4 outils disponibles** :
  - 📅 **Lecture d'événements** : `get_calendar_events`
  - 🔍 **Recherche de créneaux libres** : `find_free_slots`
  - ✏️ **Création d'événements** : `create_calendar_event`
  - 🎥 **Ajout de Google Meet** : `add_google_meet`

### 🔐 Authentification & Sécurité
- **NextAuth.js** avec Google OAuth 2.0
- **Token Manager** : Rafraîchissement automatique des tokens Google
- **Prisma** : Gestion sécurisée des sessions et tokens en base de données (SQLite)

### 🎨 Interface Moderne
- **Next.js 15** (App Router)
- **React 18** avec hooks optimisés
- **Tailwind CSS** : Design moderne et responsive
- **Calendrier interactif** : Vues mois/semaine/jour

---

## 🚀 Installation & Configuration

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Google Cloud avec API activées

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd google-tempo
npm install
```

### 2. Configuration Google Cloud

#### A. Créer un projet Google Cloud
1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet
3. Activez les APIs suivantes :
   - **Google Calendar API**
   - **Google Drive API** (optionnel)
   - **Generative Language API** (Gemini)

#### B. Créer les credentials OAuth 2.0
1. **APIs & Services** > **Credentials**
2. **Create Credentials** > **OAuth 2.0 Client ID**
3. Type : **Web application**
4. **Authorized redirect URIs** :
   ```
   http://localhost:3000/api/auth/callback/google
   https://votre-domaine.com/api/auth/callback/google
   ```
5. Téléchargez le fichier JSON (ne PAS le commiter !)

#### C. Obtenir la clé API Gemini
1. [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Créez une clé API

### 3. Variables d'environnement

Créez un fichier `.env.local` à la racine :

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<générez avec: openssl rand -base64 32>

# Google OAuth (depuis le JSON téléchargé)
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret

# Gemini AI
GOOGLE_API_KEY=votre-cle-api-gemini

# Database (SQLite par défaut)
DATABASE_URL=file:./prisma/dev.db
```

### 4. Base de données Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Créer la base de données
npx prisma db push

# (Optionnel) Voir la base de données
npx prisma studio
```

### 5. Lancer le serveur

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000)

---

## 📁 Architecture du Projet

```
google-tempo/
├── app/                          # Next.js 15 App Router
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth OAuth
│   │   ├── chat/                 # API Agent LangGraph
│   │   └── calendar/events/      # API Google Calendar
│   ├── layout.tsx                # Layout principal
│   └── page.tsx                  # Page d'accueil (chat + calendrier)
│
├── lib/
│   ├── agent/                    # 🧠 Agent LangGraph
│   │   ├── graph.ts              # Définition du graphe ReAct
│   │   ├── tools/
│   │   │   └── calendar.ts       # Outils de l'agent (4 outils)
│   │   └── types.ts              # Types de l'agent
│   │
│   ├── auth/                     # 🔐 Authentification
│   │   ├── auth-options.ts       # Config NextAuth
│   │   └── token-manager.ts      # Gestion des tokens Google
│   │
│   ├── actions/
│   │   └── calendar-helpers.ts   # Helpers Google Calendar API
│   │
│   └── prisma.ts                 # Client Prisma
│
├── components/                   # Composants React
│   ├── chat/                     # Interface chat
│   ├── calendar/                 # Vues calendrier
│   ├── events/                   # Panneau détails événements
│   └── notifications/            # Système de notifications
│
├── prisma/
│   └── schema.prisma             # Schéma base de données
│
└── types/
    ├── index.ts                  # Types globaux
    └── next-auth.d.ts            # Types NextAuth étendus
```

---

## 🧠 Fonctionnement de l'Agent

### Architecture LangGraph (ReAct)

```
┌─────────────────────────────────────────────┐
│           USER INPUT (Chat)                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
         ┌─────────────────┐
         │   AGENT NODE    │ ← Gemini 2.5 Flash
         │  (Raisonnement) │
         └────────┬─────────┘
                  │
                  ▼
         ┌────────────────┐
         │ shouldContinue │ ← Décision
         └────┬──────────┬┘
         OUI  │          │ NON
              ▼          ▼
      ┌──────────────┐  END
      │  TOOL NODE   │  (Réponse)
      │  (Actions)   │
      └──────┬───────┘
             │
             └──────────┐
                        │
                ┌───────▼────────┐
                │  AGENT NODE    │ ← Analyse résultats
                │  (Tour 2)      │
                └───────┬────────┘
                        │
                        ▼
                   (Boucle...)
```

### Exemple de Conversation

**Utilisateur** : `"Planifie du sport demain aprem"`

**Agent (Tour 1)** :
- 🧠 Analyse : "L'utilisateur veut créer un événement"
- 🛠️ **Décision** : Appeler `find_free_slots` (demain 14h-18h, 60 min)

**Tool Node** :
- 🔍 Exécute `find_free_slots`
- 📦 Retourne : `{"success": true, "slots": [...]}`

**Agent (Tour 2)** :
- 🧠 Analyse : "4 créneaux disponibles, je choisis 14h"
- 🛠️ **Décision** : Appeler `create_calendar_event`

**Tool Node** :
- ✏️ Exécute `create_calendar_event`
- 📦 Retourne : `{"success": true, "event": {...}}`

**Agent (Tour 3)** :
- 🧠 Analyse : "Événement créé avec succès"
- ✋ **Réponse finale** : `"✅ J'ai créé 'Sport' demain à 14h"`

---

## 🛠️ Technologies Utilisées

| Catégorie | Technologies |
|-----------|--------------|
| **Frontend** | Next.js 15, React 18, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes, Prisma (SQLite) |
| **AI/Agent** | LangGraph, LangChain Core, Gemini 2.5 Flash |
| **Auth** | NextAuth.js, Google OAuth 2.0 |
| **APIs** | Google Calendar API, Google Drive API |
| **Validation** | Zod |
| **Database** | Prisma + SQLite (migratable vers PostgreSQL) |

---

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev               # Lancer le serveur (port 3000)

# Build & Production
npm run build            # Build pour production
npm start                # Lancer en production

# Prisma
npx prisma generate      # Générer le client Prisma
npx prisma db push       # Synchroniser le schéma
npx prisma studio        # Interface graphique DB
npx prisma migrate dev   # Créer une migration

# Linting
npm run lint             # ESLint
```

---

## 🐛 Debugging

### Activer les logs de debug

Les logs de l'agent sont déjà activés avec des emojis pour faciliter le suivi :

- 🧠 **[AGENT NODE]** : Réflexion du LLM
- 💭 **Réponse du LLM** : Décision prise
- 🔍 **[findFreeSlotsTool]** : Recherche de créneaux
- 🎯 **[createEventTool]** : Création d'événement
- 👓 **[getEventsTool]** : Lecture d'événements
- 📦 **[API /chat]** : Résultat final

### Logs en temps réel

```bash
# Dans le terminal où tourne npm run dev
# Les logs apparaissent automatiquement
```

---

## 🚀 Déploiement

### Vercel (Recommandé)

```bash
# 1. Push sur GitHub
git push origin main

# 2. Importer sur Vercel
# Ajouter les variables d'environnement

# 3. Configurer la base de données
# Remplacer SQLite par PostgreSQL (Vercel Postgres ou Supabase)
```

### Variables d'environnement Production

```bash
NEXTAUTH_URL=https://votre-domaine.vercel.app
NEXTAUTH_SECRET=<secret-fort>
GOOGLE_CLIENT_ID=<votre-client-id>
GOOGLE_CLIENT_SECRET=<votre-client-secret>
GOOGLE_API_KEY=<votre-cle-gemini>
DATABASE_URL=postgresql://... # PostgreSQL en production
```

---

## 📝 Licence

MIT

---

## 👨‍💻 Auteur

Développé avec ❤️ par **Rayane Kryslak-Medioub**

---

## 🙏 Remerciements

- [LangChain](https://www.langchain.com/) / [LangGraph](https://www.langchain.com/langgraph)
- [Google Gemini](https://deepmind.google/technologies/gemini/)
- [Next.js](https://nextjs.org/)
- [NextAuth.js](https://next-auth.js.org/)
- [Prisma](https://www.prisma.io/)

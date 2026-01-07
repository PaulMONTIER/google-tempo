# 📡 Tempo API Documentation

> Version: 1.0.0 | Base URL: `/api`

Toutes les routes nécessitent une session authentifiée via NextAuth (sauf mention contraire).

---

## 🔐 Authentication

### `GET /api/auth/[...nextauth]`
Gestion complète de l'authentification via NextAuth.js.

| Endpoint | Description |
|----------|-------------|
| `/api/auth/signin` | Page de connexion |
| `/api/auth/signout` | Déconnexion |
| `/api/auth/session` | Session courante |
| `/api/auth/providers` | Liste des providers |
| `/api/auth/csrf` | Token CSRF |
| `/api/auth/callback/google` | Callback OAuth Google |

**Scopes Google demandés :**
- `openid`, `email`, `profile`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/drive.readonly`

---

## 💬 Chat & Agent IA

### `POST /api/chat`
Envoie un message à l'agent Tempo et reçoit une réponse.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Crée un événement demain à 14h" }
  ],
  "requireConfirmation": true,
  "rules": [
    { "id": "1", "condition": "...", "action": "...", "enabled": true }
  ]
}
```

**Response:**
```json
{
  "message": "J'ai préparé un événement pour demain à 14h. Tu confirmes ?",
  "events": [],
  "action": "pending",
  "pendingEvent": {
    "type": "pending_event",
    "event": { "title": "...", "startDateTime": "...", "endDateTime": "..." }
  },
  "proposal": null,
  "metadata": { "responseTime": 1234, "toolCalls": 2 }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Réponse textuelle de l'agent |
| `action` | string | `pending` \| `created` \| `deleted` \| `none` |
| `pendingEvent` | object? | Événement en attente de confirmation |
| `proposal` | object? | Proposition intelligente (Phase 5) |

### `GET /api/chat`
Health check de l'agent.

**Response:** `{ "status": "ok", "service": "Tempo Agent API", "version": "1.0.0" }`

---

## 📅 Calendar

### `GET /api/calendar/events`
Récupère les événements des 90 prochains jours.

**Response:**
```json
{
  "events": [
    {
      "id": "abc123",
      "title": "Réunion",
      "startDate": "2024-12-20T14:00:00Z",
      "endDate": "2024-12-20T15:00:00Z",
      "location": "Bureau",
      "color": "#2383e2"
    }
  ]
}
```

### `POST /api/calendar/events/confirm`
Confirme un événement en attente (création, modification ou suppression).

**Request:**
```json
{
  "action": "confirm",
  "event": {
    "title": "Réunion",
    "startDateTime": "2024-12-20T14:00:00",
    "endDateTime": "2024-12-20T15:00:00"
  }
}
```

**Actions possibles :**
- `confirm` : Crée l'événement
- `cancel` : Annule la création
- `delete` : Supprime un événement existant
- `batch_delete` : Supprime plusieurs événements

---

## 🎮 Gamification

### `GET /api/gamification/progress`
Récupère la progression XP et niveau de l'utilisateur.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalXP": 1250,
    "level": 5,
    "currentLevelXP": 250,
    "xpToNextLevel": 500,
    "streak": 7
  }
}
```

### `POST /api/gamification/progress`
Ajoute de l'XP (usage interne).

**Request:**
```json
{
  "amount": 50,
  "actionType": "event_created",
  "eventId": "abc123",
  "multiplier": 1.5
}
```

### `GET /api/gamification/skills`
Récupère les compétences de l'utilisateur (radar chart).

**Response:**
```json
{
  "success": true,
  "skills": [
    { "familyId": "organisation", "name": "Organisation", "level": 3, "xp": 450 },
    { "familyId": "communication", "name": "Communication", "level": 2, "xp": 200 }
  ]
}
```

### `GET /api/gamification/xp`
Historique détaillé des gains XP.

### `GET /api/gamification/task-validations`
Liste des tâches à valider (événements passés).

**Query params:**
- `count=true` : Retourne uniquement le nombre

### `GET /api/gamification/quizzes`
Liste des quiz disponibles.

### `POST /api/gamification/quizzes/[quizId]/answer`
Soumet une réponse à une question.

**Request:**
```json
{
  "questionId": "q1",
  "selectedAnswer": 2
}
```

### `POST /api/gamification/quizzes/[quizId]/complete`
Marque un quiz comme terminé.

### `POST /api/gamification/quizzes/dismiss`
Masque un quiz.

---

## 🌳 Preparation Trees

### `GET /api/trees`
Récupère tous les arbres de préparation (examens + révisions).

**Response:**
```json
{
  "success": true,
  "trees": [
    {
      "id": "tree_123",
      "goalTitle": "Examen Maths",
      "goalDate": "2024-12-25",
      "branches": [
        { "id": "branch_1", "title": "Révision Chapitre 1", "date": "2024-12-20" }
      ]
    }
  ]
}
```

### `POST /api/trees`
Crée un nouvel arbre de préparation.

**Request:**
```json
{
  "treeId": "tree_abc",
  "goalEventId": "event_123",
  "goalTitle": "Examen Final",
  "goalDate": "2024-12-25",
  "detectionMethod": "semantic"
}
```

### `GET /api/trees/[treeId]`
Récupère un arbre spécifique.

### `DELETE /api/trees/[treeId]`
Supprime un arbre.

### `POST /api/analyze-trees`
Analyse rétroactive pour détecter les arbres existants.

---

## 🎯 Onboarding

### `GET /api/onboarding/status`
État de l'onboarding utilisateur.

**Response:**
```json
{
  "completed": false,
  "step": 2,
  "retroactiveAnalysisDone": false,
  "data": {
    "priorityActivities": ["studies", "sport"],
    "studySubjects": ["maths", "physics"],
    "sportDiscipline": "running",
    "targetSoftSkills": ["organisation", "focus"],
    "dailyNotificationTime": "08:00",
    "messageTone": "supportive"
  }
}
```

### `POST /api/onboarding/complete`
Marque l'onboarding comme terminé.

**Request:**
```json
{
  "preferences": {
    "priorityActivities": ["studies"],
    "studySubjects": ["maths"],
    "messageTone": "direct"
  }
}
```

### `POST /api/onboarding/skip`
Ignore l'onboarding.

### `POST /api/onboarding/reset`
Réinitialise l'onboarding (dev only).

---

## 🔔 Notifications

### `GET /api/notifications/reminders`
Récupère les rappels actifs.

**Response:**
```json
{
  "reminders": [
    {
      "id": "rem_1",
      "eventId": "event_123",
      "eventTitle": "Réunion",
      "triggerAt": "2024-12-20T13:45:00Z",
      "type": "before_event"
    }
  ]
}
```

---

## 🎤 Voice (Gemini Live)

### `GET /api/voice/token`
Génère un token éphémère pour Gemini Live API.

**Response:**
```json
{
  "token": "authTokens/abc123...",
  "expiresAt": "2024-12-19T15:30:00Z",
  "model": "models/gemini-2.5-flash-native-audio-preview-09-2025"
}
```

### `POST /api/voice/execute-tool`
Exécute un outil calendrier depuis l'assistant vocal.

**Request:**
```json
{
  "toolName": "create_event",
  "args": {
    "title": "Réunion",
    "startDateTime": "2024-12-20T14:00:00"
  }
}
```

---

## 💡 Suggestions

### `GET /api/suggestions/resources`
Récupère des ressources suggérées.

**Query params:**
- `category` : `studies` | `sport`
- `subjectOrSport` : `maths` | `running` | etc.

**Response:**
```json
{
  "resources": [
    {
      "id": "maths-khan",
      "title": "Cours de Maths - Khan Academy",
      "type": "course",
      "provider": "Khan Academy",
      "url": "https://...",
      "difficulty": "beginner"
    }
  ]
}
```

---

## 📊 Analysis

### `POST /api/analysis/retroactive`
Lance l'analyse rétroactive du calendrier pour détecter patterns et arbres.

---

## ⚙️ Preferences

### `POST /api/preferences/promotional`
Met à jour les préférences de communication.

**Request:**
```json
{
  "showPromotionalBanner": false
}
```

---

## 🛠️ Dev Tools

### `POST /api/dev/reset-account`
⚠️ **Dev only** - Réinitialise complètement le compte utilisateur.

---

## 🚨 Error Responses

Toutes les erreurs suivent ce format :

```json
{
  "error": "Description de l'erreur",
  "code": "ERROR_CODE"
}
```

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Session invalide ou expirée |
| `INVALID_REQUEST` | 400 | Paramètres manquants ou invalides |
| `NOT_FOUND` | 404 | Ressource non trouvée |
| `REAUTH_REQUIRED` | 401 | Token Google expiré, reconnexion nécessaire |
| `AGENT_NOT_READY` | 500 | Agent IA non initialisé |

---

## 📝 Notes

- Toutes les dates sont en ISO 8601 (UTC)
- Les IDs sont des CUIDs générés par Prisma
- Le rate limiting n'est pas encore implémenté
- RLS Supabase à activer en production


# 🚀 Plan d'Implémentation Tempo - Par Difficulté

---

## 🟢 NIVEAU 1 : Facile (1-3h chacun)

### 1.1 Enlever le hardcoding des paramètres
**Temps estimé : 2h**

**Fichiers à créer/modifier :**
- `lib/config/defaults.ts` (nouveau)
- `lib/config/user-settings.ts` (nouveau)

**Tâches :**
```
[ ] Créer lib/config/defaults.ts avec toutes les valeurs par défaut :
    - TIMEZONE: "Europe/Paris"
    - DEFAULT_EVENT_DURATION: 60
    - WEEK_START: "monday" | "sunday"
    - TIME_FORMAT: "24h" | "12h"
    - ACCENT_COLORS: [...]
    - LANGUAGES: ["fr", "en"]

[ ] Créer un hook useUserSettings() qui merge defaults + localStorage

[ ] Remplacer les valeurs hardcodées dans :
    - lib/agent/tools/calendar/*.ts
    - components/calendar/*.tsx
    - components/settings/SettingsPanel.tsx
```

---

### 1.2 Règles injectées dans le prompting
**Temps estimé : 2-3h**

**Fichiers à modifier :**
- `app/api/chat/route.ts`
- `lib/agent/prompts/system-prompt.ts`
- `lib/agent/graph.ts`

**Tâches :**
```
[ ] Modifier /api/chat pour accepter les rules dans le body :
    interface ChatRequest {
      message: string;
      rules?: Rule[];
    }

[ ] Modifier system-prompt.ts :
    export const buildSystemPrompt = (rules: Rule[]) => `
      ${BASE_PROMPT}
      
      ## Règles utilisateur à respecter :
      ${rules.map(r => `- ${r.name}: ${r.description}`).join('\n')}
    `;

[ ] Côté client, envoyer les rules depuis localStorage dans la requête

[ ] Tester avec une règle type "Jamais de réunions avant 10h"
```

---

## 🟡 NIVEAU 2 : Medium (1-2 jours chacun)

### 2.1 Confirmation humaine pour les événements
**Temps estimé : 1 jour**

**Fichiers à créer/modifier :**
- `components/chat/EventConfirmationCard.tsx` (nouveau)
- `lib/agent/tools/calendar/create-event.ts`
- `app/api/chat/route.ts`
- `types/index.ts`

**Tâches :**
```
[ ] Ajouter un type de réponse "pending_event" :
    interface PendingEvent {
      type: "pending_event";
      event: {
        title: string;
        start: string;
        end: string;
        description?: string;
      };
      message: string;
    }

[ ] Modifier create-event tool pour retourner en mode preview (flag)

[ ] Créer EventConfirmationCard avec 3 boutons :
    - ✅ Accepter → appel API pour créer réellement
    - ✏️ Modifier → ouvre formulaire pré-rempli
    - ❌ Refuser → demande raison à l'IA

[ ] Gérer le flow "refus" : l'IA demande pourquoi et propose alternatives

[ ] Ajouter animation d'apparition de la carte
```

---

### 2.2 Formulaires dynamiques IA
**Temps estimé : 1-2 jours**

**Fichiers à créer/modifier :**
- `components/chat/DynamicFormRenderer.tsx` (nouveau)
- `lib/agent/prompts/system-prompt.ts`
- `hooks/use-chat-messages.ts`
- `types/index.ts`

**Tâches :**
```
[ ] Définir le schema DynamicForm :
    interface DynamicForm {
      type: "form";
      title: string;
      fields: FormField[];
      context: string;
    }
    
    interface FormField {
      id: string;
      label: string;
      type: "text" | "date" | "time" | "select" | "duration" | "textarea";
      options?: string[];
      required: boolean;
      placeholder?: string;
      defaultValue?: string;
    }

[ ] Modifier system prompt pour générer ce JSON quand infos manquantes

[ ] Créer DynamicFormRenderer :
    - Render les champs selon leur type
    - Validation des champs required
    - Boutons "Envoyer" et "Annuler"

[ ] Détecter type: "form" dans la réponse et afficher le formulaire

[ ] Renvoyer les données remplies à l'agent avec le context

[ ] Tester : "Crée un événement" → formulaire demandant titre, date, durée
```

---

### 2.3 Améliorer le système de notifications
**Temps estimé : 1-2 jours**

**Fichiers à créer/modifier :**
- `prisma/schema.prisma` (table Notification)
- `app/api/notifications/route.ts` (nouveau)
- `components/notifications/NotificationPanel.tsx`
- `hooks/use-notifications.ts` (nouveau)

**Tâches :**
```
[ ] Ajouter table Prisma Notification :
    model Notification {
      id        String   @id @default(cuid())
      userId    String
      type      String   // "event_created", "reminder", "quiz", etc.
      title     String
      message   String
      read      Boolean  @default(false)
      createdAt DateTime @default(now())
      metadata  Json?
    }

[ ] API CRUD /api/notifications

[ ] Hook useNotifications avec SWR/polling

[ ] Améliorer le design :
    - Grouper par jour
    - Badge counter sur l'icône 🔔
    - Actions inline : marquer lu, supprimer
    - Animation slide-in

[ ] Intégrer avec les events créés (notification auto)
```

---

### 2.4 Revoir le design des arbres
**Temps estimé : 2 jours**

**Fichiers à modifier :**
- `components/arbre/ArbrePanel.tsx`
- `components/arbre/TreeItem.tsx`
- `lib/trees/tree-formatter.ts`

**Tâches :**
```
[ ] Améliorer le parsing (plus robuste que les commentaires HTML)

[ ] Nouveau design :
    - Vue timeline horizontale OU verticale (toggle)
    - Couleurs par type d'event
    - Icônes selon le statut (✅ fait, 🔄 en cours, ⏳ à venir)
    - Progress bar ou ring animé
    - Connexions visuelles entre les noeuds

[ ] Interactions :
    - Clic sur noeud → détails de l'event
    - Drag & drop pour réorganiser (optionnel)
    - Zoom in/out si beaucoup de noeuds

[ ] (Optionnel) Intégrer React Flow pour visu avancée
```

---

## 🔴 NIVEAU 3 : Difficile (3-5 jours chacun)

### 3.1 Éditeur de texte + Drive
**Temps estimé : 4-5 jours**

**Dépendances à installer :**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-table 
npm install @tiptap/extension-color @tiptap/extension-text-style
npm install katex @tiptap/extension-mathematics
```

**Fichiers à créer :**
- `components/editor/TipTapEditor.tsx`
- `components/editor/EditorToolbar.tsx`
- `components/editor/DriveFilePicker.tsx`
- `lib/drive/drive-service.ts`
- `app/api/drive/upload/route.ts`
- `app/api/drive/folders/route.ts`

**Tâches :**

#### Phase 1 : Éditeur de base (1 jour)
```
[ ] Setup TipTap avec extensions de base
[ ] Toolbar : gras, italique, souligné, barré
[ ] Couleurs de texte et surlignage
[ ] Listes à puces et numérotées
[ ] Alignement texte
```

#### Phase 2 : Features avancées (1 jour)
```
[ ] Extension tableaux (insert, resize, delete)
[ ] Extension LaTeX avec KaTeX (preview inline)
[ ] Titres H1-H6
[ ] Code blocks avec syntax highlighting
```

#### Phase 3 : Intégration Drive (2 jours)
```
[ ] Ajouter scope drive.file dans OAuth
[ ] API /api/drive/folders → liste les dossiers
[ ] API /api/drive/upload → crée/update un Doc
[ ] Composant DriveFilePicker (modal arborescence)
[ ] Bouton "Push to Drive" avec sélection dossier
[ ] Gestion des conflits (déjà existant → update ou nouveau)
```

#### Phase 4 : Lien Calendrier (1 jour)
```
[ ] Bouton "Lier à un événement" 
[ ] Sélecteur d'event (liste ou recherche)
[ ] Ajoute le lien Drive dans la description de l'event
[ ] Afficher le lien dans EventDetailsPanel
```

---

### 3.2 Analyse des mails (invitations)
**Temps estimé : 3-4 jours**

> ⚠️ Nécessite scope `gmail.readonly` et vérification Google

**Fichiers à créer :**
- `lib/gmail/gmail-service.ts`
- `lib/gmail/invitation-parser.ts`
- `app/api/gmail/invitations/route.ts`
- `components/calendar/PendingInvitation.tsx`
- `hooks/use-invitations.ts`

**Tâches :**

#### Phase 1 : Setup Gmail API (1 jour)
```
[ ] Ajouter scope gmail.readonly
[ ] Créer gmail-service.ts avec OAuth client
[ ] Fonction fetchRecentMails(query, maxResults)
```

#### Phase 2 : Parser les invitations (1 jour)
```
[ ] Détecter les mails d'invitation :
    - Header X-Google-Calendar-Event-Id
    - Sujet contenant "Invitation:" ou "Invite:"
    - Content-Type: text/calendar
    
[ ] Parser le .ics attaché (librairie ical.js)
[ ] Extraire : titre, date, heure, organizer, location
```

#### Phase 3 : Affichage "fantôme" (1 jour)
```
[ ] Créer composant PendingInvitation
[ ] Style : opacity 50%, bordure pointillée, fond hachuré
[ ] Badge "En attente" sur le coin

[ ] Afficher dans le calendrier aux bonnes dates
[ ] 3 boutons : Accepter / Refuser / Ignorer
```

#### Phase 4 : Actions (1 jour)
```
[ ] Accepter → créer l'event réel + répondre au mail (Gmail API)
[ ] Refuser → répondre "declined" + archiver
[ ] Ignorer → cacher (stocker en localStorage)

[ ] Polling régulier (toutes les 5 min) ou bouton refresh manuel
```

---

## 📅 Planning Suggéré

### Semaine 1 : Fondations
| Jour | Tâche |
|------|-------|
| J1 | 🟢 Enlever hardcoding |
| J2 | 🟢 Règles en prompting |
| J3-J4 | 🟡 Confirmation humaine |
| J5 | Tests & fixes |

### Semaine 2 : UX Améliorée
| Jour | Tâche |
|------|-------|
| J1-J2 | 🟡 Formulaires dynamiques |
| J3-J4 | 🟡 Système notifications |
| J5 | Tests & fixes |

### Semaine 3 : Arbres & Éditeur
| Jour | Tâche |
|------|-------|
| J1-J2 | 🟡 Design arbres |
| J3-J5 | 🔴 Éditeur TipTap (phase 1-2) |

### Semaine 4 : Drive & Gmail
| Jour | Tâche |
|------|-------|
| J1-J2 | 🔴 Éditeur Drive (phase 3-4) |
| J3-J5 | 🔴 Analyse mails Gmail |

---

## ✅ Checklist Globale

```
NIVEAU 1 - FACILE
[ ] Enlever hardcoding paramètres
[ ] Règles en prompting

NIVEAU 2 - MEDIUM  
[ ] Confirmation humaine événements
[ ] Formulaires dynamiques IA
[ ] Améliorer notifications
[ ] Revoir design arbres

NIVEAU 3 - DIFFICILE
[ ] Éditeur TipTap complet
[ ] Intégration Google Drive
[ ] Analyse mails Gmail
```

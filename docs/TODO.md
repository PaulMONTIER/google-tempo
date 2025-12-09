# 🎯 Tempo - TODO Roadmap

## Priorités et Estimations

| # | Feature | Complexité | Priorité |
|---|---------|------------|----------|
| 1 | Formulaires dynamiques IA | 🟡 Medium | 🔴 Haute |
| 2 | Règles en prompting | 🟢 Facile | 🔴 Haute |
| 3 | Enlever hardcoding paramètres | 🟢 Facile | 🟡 Moyenne |
| 4 | Éditeur de texte + Drive | 🔴 Élevée | 🟡 Moyenne |
| 5 | Analyse des mails | 🔴 Élevée | 🟢 Basse |
| 6 | Revoir les arbres | 🟡 Medium | 🟡 Moyenne |
| 7 | Système de notifications | 🟡 Medium | 🟡 Moyenne |
| 8 | Confirmation humaine | 🟡 Medium | 🔴 Haute |

---

## 1. 📝 Formulaires dynamiques IA

**Objectif** : Quand l'IA n'a pas assez de détails, elle génère un formulaire personnalisé.

### Schema proposé
```typescript
interface DynamicForm {
  type: "form";
  title: string;
  fields: {
    id: string;
    label: string;
    type: "text" | "date" | "time" | "select" | "duration";
    options?: string[]; // pour select
    required: boolean;
    placeholder?: string;
  }[];
  context: string; // pour que l'IA reprenne le fil
}
```

### Actions
- [ ] Modifier le system prompt pour générer ce format JSON
- [ ] Créer un composant `DynamicFormRenderer`
- [ ] Détecter `type: "form"` dans la réponse de l'agent
- [ ] Renvoyer les données du formulaire à l'agent

---

## 2. ⚙️ Règles en prompting (pas hardcodé)

**Objectif** : Injecter les règles utilisateur dans le system prompt de l'agent.

### Problème actuel
- Règles stockées en localStorage (client-side)
- Jamais utilisées par l'agent

### Solution
```typescript
// Dans lib/agent/prompts/system-prompt.ts
const rulesPrompt = `
## Règles utilisateur actives :
${rules.map(r => `- [${r.name}] : ${r.description}`).join('\n')}

Tu dois respecter ces règles lors de la création/modification d'événements.
`;
```

### Actions
- [ ] Passer les règles au backend via body de `/api/chat`
- [ ] Injecter dans le system prompt
- [ ] Alternative : stocker les règles en DB (table `Rule`)

---

## 3. 🔧 Enlever le hardcoding des paramètres

### Valeurs actuellement hardcodées
- Fuseau horaire "Europe/Paris"
- Durée par défaut des événements
- Couleurs d'accent disponibles
- Langues supportées
- Format heure (12h/24h)
- Début de semaine

### Actions
- [ ] Créer `lib/config/defaults.ts` centralisé
- [ ] Passer les settings user au backend
- [ ] L'agent respecte les préférences user

---

## 4. 📄 Éditeur de texte + Drive

**Le plus gros chantier**

### Stack suggérée
- **Éditeur** : TipTap ou Lexical
- **Tableaux** : `@tiptap/extension-table`
- **LaTeX** : `katex` + extension custom

### Features requises
- [x] Gras, italique, souligner
- [ ] Couleurs de texte
- [ ] Tableaux
- [ ] Formules LaTeX
- [ ] Push to Drive

### Intégration Drive
- Scope : `drive.file`
- API : `drive.files.create()` avec `mimeType: 'application/vnd.google-apps.document'`
- Sélecteur de dossier destination

### Connexion Calendrier
- Bouton "Lier à un événement" → ajoute le lien Drive dans la description

---

## 5. 📧 Analyse des mails (invitations)

### Scope nécessaire
`gmail.readonly` (nécessite vérification app Google)

### Flow proposé
1. Polling périodique ou webhook Gmail
2. Chercher les mails avec `X-Google-Calendar-Event-Id`
3. Parser le `.ics` attaché
4. Afficher l'event en "fantôme" (opacity 50%, bordure pointillée)
5. Actions : "Accepter" / "Refuser" / "Ignorer"

---

## 6. 🌳 Revoir les arbres

### Problème actuel
- Dépend de commentaires HTML dans les descriptions
- Design basique

### Améliorations
- [ ] Table Prisma `Tree` et `TreeNode`
- [ ] Interface drag-and-drop
- [ ] Lib de visualisation : React Flow ou D3
- [ ] Design amélioré :
  - Timeline horizontale
  - Couleurs par type (exam = rouge, révision = bleu)
  - Progress ring au lieu de barre

---

## 7. 🔔 Système de notifications

### État actuel
- ✅ Toasts pour feedback immédiat
- ✅ Panel historique (mémoire seulement)
- ❌ Pas connecté aux emails
- ❌ Perdu au refresh

### Améliorations
- [ ] **Persistance** : stocker en DB
- [ ] **Email** : Resend/SendGrid ou Gmail API
  - Rappels X minutes avant
  - Digest quotidien/hebdomadaire
- [ ] **Push navigateur** : Service Worker + Web Push API
- [ ] **Design** :
  - Grouper par jour
  - Actions inline (snooze, dismiss)
  - Badge sur icône cloche

---

## 8. ✅ Confirmation humaine (événements)

**Objectif** : Demander confirmation avant de créer un événement.

### Flow proposé
1. L'agent propose l'événement
2. UI affiche : **Accepter** | **Modifier** | **Refuser**
3. Si "Refuser" → l'agent demande pourquoi
4. Si "Modifier" → ouvre formulaire pré-rempli

### Actions
- [ ] Ajouter état `PENDING` aux events créés par l'agent
- [ ] Composant `EventConfirmationCard`
- [ ] Modifier le tool `create_calendar_event` pour retourner en mode "preview"

---

## 🚀 Ordre de développement suggéré

1. **Quick wins** (1-2h chacun) :
   - Règles en prompting (#2)
   - Enlever hardcoding (#3)

2. **Medium** (1 jour chacun) :
   - Confirmation humaine (#8)
   - Formulaires dynamiques (#1)

3. **Gros chantiers** (plusieurs jours) :
   - Notifications améliorées (#7)
   - Revoir les arbres (#6)
   - Éditeur + Drive (#4)
   - Analyse mails (#5)

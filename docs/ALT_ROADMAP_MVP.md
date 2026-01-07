# 🎯 ALT ROADMAP - MVP Présentation

> Objectif : Démo fonctionnelle pour une présentation court-terme.
> Priorité : Fonctionnalité > Perfection.

---

## 📊 Vue d'Ensemble MVP

| # | Tâche | Status | Priorité | Temps estimé |
|---|-------|--------|----------|--------------|
| 0 | Connexion Google (Calendar, Drive, Gmail) | 🟡 Partiel | 🔴 Haute | 0.5 jour |
| 1 | Onboarding (Questionnaire + Rétro-analyse) | ✅ Existant | - | - |
| 2 | Interface Chat + Bouton "+" Intégrations | ⏳ À faire | 🔴 Haute | 0.5 jour |
| 3 | Intégration Gmail (Détection Deadlines) | ⏳ À faire | 🔴 Haute | 1 jour |
| 4 | Intégration GDrive (Sélection Documents) | ⏳ À faire | 🔴 Haute | 0.5 jour |
| 5 | Génération Programme de Révision IA | ⏳ À faire | 🔴 Haute | 1 jour |

**Temps total estimé : 3-4 jours**

---

## Phase 0 : OAuth Complet (Calendar + Drive + Gmail)

### État actuel
- ✅ Scopes présents : `calendar`, `drive.readonly`
- ❌ Scope manquant : `gmail.readonly`

### Tâches
- [ ] Ajouter le scope `https://www.googleapis.com/auth/gmail.readonly` dans `lib/auth/auth-options.ts`
- [ ] Vérifier la console Google Cloud (activer l'API Gmail)
- [ ] Tester la connexion et validation des 3 services

### Fichier concerné
```
lib/auth/auth-options.ts
```

---

## Phase 1 : Onboarding ✅ (Existant)

### Déjà en place
- [x] Questionnaire (activités, tonalité)
- [x] Rétro-analyse du calendrier
- [x] Attribution XP initiale

### Fichiers clés
```
app/onboarding/page.tsx
components/onboarding/OnboardingFlow.tsx
lib/services/retroactive-analysis.ts
```

---

## Phase 2 : Interface Chat + Bouton "+" Intégrations

### Objectif
Ajouter un bouton "+" dans l'interface de chat qui affiche les options GMAIL et GDRIVE.

### Maquette
```
┌─────────────────────────────────────────────────┐
│  [Chat avec Tempo]                              │
│                                                 │
│  ...                                            │
│                                                 │
├─────────────────────────────────────────────────┤
│ [+]  [ Message input...                    ] [➤]│
└─────────────────────────────────────────────────┘

      ↓ (clic sur +)

┌─────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────┐                 │
│ │   📧        │ │   📁        │                 │
│ │   GMAIL     │ │   GDRIVE    │                 │
│ └─────────────┘ └─────────────┘                 │
└─────────────────────────────────────────────────┘
```

### Tâches
- [ ] Créer `components/chat/IntegrationMenu.tsx`
- [ ] Modifier `components/chat/ChatInterface.tsx` pour ajouter le bouton "+"
- [ ] État pour afficher/masquer le menu

### Fichiers à créer/modifier
```
components/chat/IntegrationMenu.tsx (nouveau)
components/chat/ChatInterface.tsx (modifier)
```

---

## Phase 3 : Intégration Gmail (Détection Deadlines)

### Objectif
Analyser les emails des 2 derniers jours et détecter les deadlines (partiels, rendus, etc.).

### Flow
```
[Clic sur Gmail] → API Gmail → Récupère emails → 
IA analyse → Détecte deadlines → Propose ajout calendrier
```

### Tâches
- [ ] Créer `lib/services/gmail-service.ts` :
  - Fonction `fetchRecentEmails(accessToken, days = 2)`
  - Fonction `analyzeEmailsForDeadlines(emails)` (via Gemini)
- [ ] Créer API `/app/api/gmail/analyze/route.ts`
- [ ] Créer composant `components/chat/GmailDeadlineCard.tsx` pour afficher les résultats
- [ ] Intégrer avec le chat pour proposer l'ajout au calendrier

### Fichiers à créer
```
lib/services/gmail-service.ts (nouveau)
app/api/gmail/analyze/route.ts (nouveau)
components/chat/GmailDeadlineCard.tsx (nouveau)
```

### Prompt IA pour détection
```
Analyse les emails suivants et détecte les deadlines académiques ou professionnelles.
Pour chaque deadline trouvée, extrais :
- Titre (ex: "Partiel Maths")
- Date
- Source (sujet de l'email)
- Niveau d'urgence
```

---

## Phase 4 : Intégration GDrive (Sélection Documents)

### Objectif
Permettre à l'utilisateur de sélectionner des documents depuis Google Drive pour les transmettre à Tempo.

### Flow
```
[Clic sur GDrive] → Google Picker API → Sélection fichiers → 
Retourne métadonnées → Affiche dans le chat
```

### Tâches
- [ ] Créer `lib/services/gdrive-service.ts` :
  - Fonction `listFiles(accessToken, query?)`
  - Fonction `getFileContent(accessToken, fileId)` (pour les Google Docs/Sheets)
- [ ] Créer API `/app/api/gdrive/files/route.ts`
- [ ] Créer composant `components/chat/DriveFilePicker.tsx`
- [ ] Intégrer avec le chat

### Fichiers à créer
```
lib/services/gdrive-service.ts (nouveau)
app/api/gdrive/files/route.ts (nouveau)
components/chat/DriveFilePicker.tsx (nouveau)
```

---

## Phase 5 : Génération Programme de Révision IA

### Objectif
À partir d'un événement (ex: Partiel Maths le 15 janvier) et de documents fournis, générer un programme de révision personnalisé.

### Flow
```
[Événement créé] → "Tu veux un programme ?" → Oui →
"As-tu des documents ?" → [Sélection GDrive] →
IA génère programme → Affiche dans chat → Option créer événements
```

### Tâches
- [ ] Créer `lib/services/revision-planner.ts` :
  - Fonction `generateRevisionPlan(event, documents, daysUntilExam)`
- [ ] Prompt structuré pour Gemini :
  - Analyse du contenu des documents
  - Distribution des révisions sur les jours disponibles
  - Suggestions de méthodes (fiches, exercices, etc.)
- [ ] Composant `components/chat/RevisionPlanCard.tsx` pour afficher le plan
- [ ] Bouton "Ajouter au calendrier" pour créer les sessions de révision

### Fichiers à créer
```
lib/services/revision-planner.ts (nouveau)
components/chat/RevisionPlanCard.tsx (nouveau)
```

### Exemple de sortie
```
📚 Programme de révision - Partiel Maths (15 janvier)

📅 Semaine 1 (6-12 janvier)
├── Lun 6 : Chapitre 1 - Intégrales (2h)
├── Mar 7 : Exercices Chapitre 1 (1h30)
├── Mer 8 : Chapitre 2 - Séries (2h)
├── Jeu 9 : Exercices Chapitre 2 (1h30)
└── Ven 10 : Révision globale (2h)

📅 Semaine 2 (13-14 janvier)
├── Lun 13 : Annales (3h)
└── Mar 14 : Relecture fiches (1h)

[Ajouter ces sessions au calendrier]
```

---

## 🧪 Plan de Vérification

### Tests manuels (Priorité)

1. **OAuth complet**
   - Se déconnecter
   - Se reconnecter
   - Vérifier que Calendar, Drive ET Gmail sont accessibles
   - Symptôme de succès : pas d'erreur 403 sur les appels API

2. **Bouton + Intégrations**
   - Aller dans le chat
   - Cliquer sur "+"
   - Vérifier que Gmail et GDrive apparaissent

3. **Gmail → Deadlines**
   - Envoyer un email de test avec "Partiel de [matière] le [date]"
   - Cliquer sur Gmail
   - Vérifier que la deadline est détectée
   - Ajouter au calendrier
   - Vérifier l'événement dans Google Calendar

4. **GDrive → Documents**
   - Avoir un document dans Drive
   - Cliquer sur GDrive
   - Sélectionner le document
   - Vérifier qu'il apparaît dans le chat

5. **Programme de révision**
   - Créer un partiel
   - Demander un programme
   - Fournir un document
   - Vérifier le plan généré
   - Ajouter au calendrier

---

## 📝 Notes

- **Priorité absolue** : Avoir un flow fonctionnel de bout en bout.
- **Accepté** : UI simple, pas d'animations, messages basiques.
- **Rejeté** : Bugs bloquants, erreurs 500, scopes manquants.

---

## 🔗 Lien avec la Roadmap principale

Une fois ce MVP validé, on reviendra sur la roadmap principale pour :
- Peaufiner la gamification (Phases 5-7-10)
- Ajouter les notifications intelligentes (Phase 8)
- Implémenter les badges savoirs-être (Phase 10)

La gamification aura plus de sens car Tempo fonctionnera correctement !

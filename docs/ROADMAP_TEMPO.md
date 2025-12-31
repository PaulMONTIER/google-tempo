# 🚀 ROADMAP TEMPO - Plan d'Exécution Détaillé

> Document de référence pour le développement de Tempo
> Dernière mise à jour : 18 décembre 2024

---

## 📊 Vue d'Ensemble

| # | Phase | Status | Priorité | Temps estimé |
|---|-------|--------|----------|--------------|
| 1 | OAuth & Authentification | ✅ Terminé | - | - |
| 2 | Onboarding & Questionnaire | ✅ Terminé | - | - |
| 3 | Analyse Rétroactive | ✅ Terminé | - | - |
| 4 | Home : Calendrier + Chat | ✅ Existant | 🟡 | Peaufinage |
| 5 | Création Événement IA | ⏳ À faire | 🔴 Haute | 2-3 jours |
| 6 | Validation Fin d'Événement | ⏳ À faire | 🔴 Haute | 2-3 jours |
| 7 | Page Progression (Clash Royale) | ⏳ À faire | 🔴 Haute | 3-4 jours |
| 8 | Notifications Intelligentes | ⏳ À faire | 🟡 Moyenne | 2-3 jours |
| 9 | Détection Seuils | ⏳ À faire | 🟡 Moyenne | 1-2 jours |
| 10 | Badges Savoirs-être | ⏳ À faire | 🔴 Haute | 3-4 jours |
| 11 | Challenges & Objectifs | ⏳ À faire | 🟡 Moyenne | 2-3 jours |
| 12 | Paramètres | ⏳ À faire | 🟢 Basse | 1-2 jours |

**Temps total estimé : 4-6 semaines**

---

# ✅ PHASES TERMINÉES

---

## Phase 1 : OAuth & Authentification ✅

### Objectif
Mettre en place l'authentification Google OAuth et l'accès aux APIs Google.

### Livrables réalisés
- [x] Configuration NextAuth avec Google OAuth
- [x] Scopes : `calendar`, `calendar.events`, `userinfo.email`, `userinfo.profile`
- [x] Migration SQLite → PostgreSQL (Supabase)
- [x] Modèle User avec champs onboarding
- [x] Gestion des sessions côté serveur

### Fichiers clés
```
lib/auth/auth-options.ts
app/api/auth/[...nextauth]/route.ts
prisma/schema.prisma (User model)
```

---

## Phase 2 : Onboarding & Questionnaire ✅

### Objectif
Questionnaire personnalisé pour adapter l'expérience Tempo.

### Livrables réalisés
- [x] WelcomeScreen avec animations et confettis
- [x] Questions multi-étapes avec skip conditionnel
- [x] Sauvegarde préférences en base (UserPreferences)

### Questions implémentées
| # | Question | Type | Condition |
|---|----------|------|-----------|
| 1 | Priorités (études/sport/pro) | Multi-select max 3 | Toujours |
| 2 | Matières étudiées | Tags input | Si études sélectionné |
| 3 | Discipline sportive | Single select | Si sport sélectionné |
| 4 | Soft skills cibles | Multi-select 3 | Toujours |
| 5 | Heure de notification | Time picker | Toujours |
| 6 | Ton des messages | Single select | Toujours |
| 7 | Intégrations sport | Multi-select | Si sport sélectionné |

### Tons disponibles
- `supportive` : Encourageant et bienveillant
- `pepTalk` : Motivant et énergique
- `lightTrashTalk` : Taquin et challenger

### Fichiers clés
```
app/onboarding/page.tsx
components/onboarding/OnboardingFlow.tsx
components/onboarding/questions/*.tsx
hooks/use-onboarding.ts
app/api/onboarding/*/route.ts
```

---

## Phase 3 : Analyse Rétroactive ✅

### Objectif
Scanner les 3 derniers mois du calendrier pour attribuer des points de départ.

### Livrables réalisés
- [x] Service RetroactiveAnalysisService
- [x] Classification IA via Gemini 2.0 Flash
- [x] Fallback mots-clés si IA échoue
- [x] Calcul points par catégorie
- [x] Intégration système XP (addXP)
- [x] Flag idempotence (1 seule fois par user)

### Règles de points
| Catégorie | Base | Bonus durée | Bonus récurrence |
|-----------|------|-------------|------------------|
| Études | 10 pts | +5 si >1h | +3 si récurrent |
| Sport | 15 pts | +10 si >1h | +5 si récurrent |
| Pro | 8 pts | +3 si >30min | +2 si récurrent |
| Personnel | 5 pts | - | - |

### Fichiers clés
```
lib/services/retroactive-analysis.ts
lib/ai/event-classifier.ts
lib/gamification/points-calculator.ts
hooks/use-retroactive-analysis.ts
app/api/analysis/retroactive/route.ts
```

---

# ⏳ PHASES À IMPLÉMENTER

---

## Phase 4 : Home - Calendrier + Chat (EXISTANT - PEAUFINAGE)

### État actuel
- [x] Vue calendrier semaine/mois
- [x] Chat avec Tempo (Gemini Live)
- [x] Création/modification événements basique
- [x] Panel détails événement

### Améliorations prévues
- [ ] Améliorer transitions et animations
- [ ] Synchronisation temps réel (optimistic updates)
- [ ] Meilleure gestion des conflits horaires
- [ ] Vue jour + vue agenda liste

### Fichiers concernés
```
components/calendar/CalendarGrid.tsx
components/chat/ChatPanel.tsx
components/events/EventDetailsPanel.tsx
```

---

## Phase 5 : Création Événement IA - Assistant Intelligent 🔴

### Objectif
Tempo reconnaît sémantiquement la demande et propose des actions intelligentes.

### Temps estimé : 2-3 jours

### Comportement attendu

#### Scénario 1 : Partiel / Examen
```
User: "J'ai un partiel de maths dans 2 semaines"
          ↓
Tempo détecte : TYPE=examen, MATIÈRE=maths, DATE=J+14
          ↓
Tempo: "Je t'ai noté ton partiel de maths le [date] 📚
        
        Tu veux que je te prépare :
        • Un programme de révision ?
        • Des ressources adaptées ?
        • Les deux ?"
          ↓
┌────────────────────────────────────────────────┐
│ [📅 Juste l'événement]                         │
│ [📋 Programme de révision]                     │
│ [📚 Ressources + Programme]                    │
└────────────────────────────────────────────────┘
```

#### Scénario 2 : Compétition sportive
```
User: "Je veux courir un marathon dans 2 mois"
          ↓
Tempo détecte : TYPE=compétition, SPORT=course, DATE=J+60
          ↓
Tempo: "Super objectif ! 🏃 Je t'ai noté le marathon le [date].
        
        Tu veux un programme d'entraînement progressif ?
        Je peux adapter selon ton niveau actuel."
          ↓
┌────────────────────────────────────────────────┐
│ [📅 Juste l'événement]                         │
│ [🏃 Programme débutant (3 séances/sem)]        │
│ [🏃 Programme intermédiaire (4 séances/sem)]   │
│ [🏃 Programme avancé (5+ séances/sem)]         │
└────────────────────────────────────────────────┘
```

#### Scénario 3 : Deadline pro
```
User: "J'ai une présentation client vendredi"
          ↓
Tempo détecte : TYPE=deadline, CONTEXTE=pro, DATE=vendredi
          ↓
Tempo: "Noté ! 💼 Ta présentation client est le [date].
        
        Tu veux que je te bloque du temps de préparation avant ?"
          ↓
┌────────────────────────────────────────────────┐
│ [📅 Juste l'événement]                         │
│ [⏰ Bloquer 2h la veille]                      │
│ [⏰ Bloquer 1h/jour jusqu'à vendredi]          │
└────────────────────────────────────────────────┘
```

### Détection sémantique requise
| Pattern | Type détecté | Propositions |
|---------|--------------|--------------|
| partiel, examen, contrôle, DS | `exam` | Programme révision + ressources |
| marathon, course, compétition, match | `competition` | Programme entraînement |
| présentation, deadline, rendu | `deadline` | Temps de préparation |
| révision, cours, TD | `study` | Ressources complémentaires |
| entraînement, séance, sport | `training` | Récurrence suggérée |

### Ressources suggérées
| Catégorie | Sources |
|-----------|---------|
| Maths | Khan Academy, OpenClassroom, Brilliant |
| Langues | Duolingo, Babbel, YouTube |
| Informatique | Codecademy, OpenClassroom, Coursera |
| Sport | Plans d'entraînement, vidéos technique |

### Tâches techniques
- [ ] Modifier `system-prompt.ts` pour détection sémantique
- [ ] Créer types `EventProposal` avec options
- [ ] Composant `EventProposalCard.tsx` avec boutons
- [ ] Service `ResourceSuggestionService` pour suggestions
- [ ] Intégration avec arbres de préparation existants
- [ ] API `/api/suggestions/resources`

### Fichiers à créer/modifier
```
lib/agent/prompts/system-prompt.ts
lib/ai/semantic-detector.ts (nouveau)
lib/services/resource-suggestion.ts (nouveau)
components/chat/EventProposalCard.tsx (nouveau)
types/proposals.ts (nouveau)
```

### Critères de validation
- [ ] "Partiel dans 2 semaines" → propose programme
- [ ] "Marathon dans 2 mois" → propose entraînement
- [ ] "Réunion demain" → juste l'événement (pas de programme)
- [ ] Ressources pertinentes par matière

---

## Phase 6 : Validation Fin d'Événement + Gamification 🔴

### Objectif
À la fin d'un événement, l'utilisateur valide et gagne des points. QCM bonus pour le scolaire.

### Temps estimé : 2-3 jours

### Flow complet

#### Étape 1 : Notification fin d'événement
```
[Push notification ou in-app]
          ↓
"Tu viens de terminer 'Révision Maths' 📚"
[Valider] [Reporter]
```

#### Étape 2 : Écran de validation
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ✅ Révision Maths terminée !                   │
│                                                 │
│  Comment ça s'est passé ?                       │
│                                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐                     │
│  │ 😊  │  │ 😐  │  │ 😓  │                     │
│  │Bien │  │Moyen│  │ Dur │                     │
│  └─────┘  └─────┘  └─────┘                     │
│                                                 │
│  ─────────────────────────────────              │
│                                                 │
│  🎉 +15 XP gagnés !                            │
│                                                 │
│  [Continuer]                                    │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Étape 3 : Quiz bonus (événements scolaires uniquement)
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  🎯 QUIZ BONUS : Maths                          │
│                                                 │
│  Réponds à 3 questions pour gagner +10 XP       │
│                                                 │
│  Question 1/3 :                                 │
│  Quelle est la dérivée de x² ?                  │
│                                                 │
│  ○ x                                            │
│  ○ 2x       ← correct                           │
│  ○ x²                                           │
│  ○ 2x²                                          │
│                                                 │
│  [Valider]                                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Étape 4 : Résultat quiz
```
┌─────────────────────────────────────────────────┐
│                                                 │
│  📊 Résultat du Quiz                            │
│                                                 │
│  ✅ 2/3 bonnes réponses                         │
│                                                 │
│  +7 XP bonus !                                  │
│                                                 │
│  Correction :                                   │
│  Q1: ✅ Correct                                 │
│  Q2: ❌ La réponse était "intégrale"            │
│  Q3: ✅ Correct                                 │
│                                                 │
│  [Fermer]                                       │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Attribution XP
| Action | XP | Condition |
|--------|-----|-----------|
| Valider un événement | +10 à +20 | Selon durée |
| Feedback "Bien" | +5 bonus | - |
| Feedback "Difficile" | +3 bonus | Persévérance |
| Quiz 3/3 | +10 | - |
| Quiz 2/3 | +7 | - |
| Quiz 1/3 | +3 | - |

### Génération Quiz IA
```typescript
interface QuizRequest {
  eventTitle: string;      // "Révision Maths - Intégrales"
  eventDescription?: string;
  category: "studies";
  subject: string;         // "Maths"
  difficulty: "easy" | "medium" | "hard";
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
```

### Tâches techniques
- [ ] Service `QuizGenerationService` avec Gemini
- [ ] Table `Quiz` et `QuizAttempt` en Prisma
- [ ] API `/api/quiz/generate`
- [ ] API `/api/quiz/submit`
- [ ] Composant `EventValidationModal.tsx`
- [ ] Composant `QuizCard.tsx`
- [ ] Notification fin d'événement (cron ou webhook Calendar)
- [ ] Attribution XP via `addXP()`

### Fichiers à créer
```
lib/services/quiz-generation.ts (nouveau)
components/gamification/EventValidationModal.tsx (nouveau)
components/gamification/QuizCard.tsx (nouveau)
app/api/quiz/generate/route.ts (nouveau)
app/api/quiz/submit/route.ts (nouveau)
app/api/events/complete/route.ts (nouveau)
```

### Prisma Schema additions
```prisma
model Quiz {
  id          String   @id @default(cuid())
  userId      String
  eventId     String?
  subject     String
  questions   Json     // QuizQuestion[]
  createdAt   DateTime @default(now())
  
  user        User     @relation(fields: [userId], references: [id])
  attempts    QuizAttempt[]
}

model QuizAttempt {
  id          String   @id @default(cuid())
  quizId      String
  userId      String
  answers     Json     // number[]
  score       Int
  xpEarned    Int
  completedAt DateTime @default(now())
  
  quiz        Quiz     @relation(fields: [quizId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
}
```

### Critères de validation
- [ ] Notification apparaît à la fin d'un événement
- [ ] Feedback émotionnel enregistré
- [ ] XP attribués correctement
- [ ] Quiz généré pertinent pour la matière
- [ ] Correction affichée avec explications

---

## Phase 7 : Page Progression - Style Clash Royale 🔴

### Objectif
Système de niveaux NON PUNITIF (on ne perd jamais de trophées) avec arènes visuelles.

### Temps estimé : 3-4 jours

### Système d'Arènes

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🏆 ARÈNE 4 : EXPERT                                        │
│  ════════════════════                                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    🏰                                │   │
│  │                   /   \                              │   │
│  │                  /     \                             │   │
│  │      ⚔️ ════════╡       ╞════════ ⚔️                │   │
│  │                  \     /                             │   │
│  │                   \___/                              │   │
│  │                                                      │   │
│  │         875 / 1000 trophées                         │   │
│  │  ████████████████████░░░░░░░░  87%                  │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Prochaine arène : MAÎTRE (1000 🏆)                        │
│  Il te manque 125 trophées !                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Définition des Arènes
| Arène | Nom | Trophées | Couleur | Icône |
|-------|-----|----------|---------|-------|
| 1 | Débutant | 0-99 | 🟤 Bronze | 🥉 |
| 2 | Apprenti | 100-299 | ⚪ Argent | 🥈 |
| 3 | Confirmé | 300-599 | 🟡 Or | 🥇 |
| 4 | Expert | 600-999 | 💎 Diamant | 💎 |
| 5 | Maître | 1000-1499 | 👑 Platine | 👑 |
| 6 | Champion | 1500-2499 | 🔥 Rubis | 🔥 |
| 7 | Légende | 2500+ | ⭐ Étoile | ⭐ |

### Récompenses par Arène
| Arène | Récompense débloquée |
|-------|----------------------|
| 2 - Apprenti | Thème Argent |
| 3 - Confirmé | Badge "Premier Pas" |
| 4 - Expert | Statistiques avancées |
| 5 - Maître | Thème Premium |
| 6 - Champion | Badge "Champion" |
| 7 - Légende | Badge "Légende" + Effets spéciaux |

### Animation Montée d'Arène
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    🎉 FÉLICITATIONS ! 🎉                    │
│                                                             │
│                    ╔═══════════════╗                        │
│                    ║   ARÈNE 4     ║                        │
│                    ║    EXPERT     ║                        │
│                    ║      💎       ║                        │
│                    ╚═══════════════╝                        │
│                                                             │
│              Tu as débloqué l'arène Expert !               │
│                                                             │
│         Nouvelle récompense : Statistiques avancées         │
│                                                             │
│                      [Continuer]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Layout Page Progression

```
┌─────────────────────────────────────────────────────────────┐
│ ← Retour                              Ma Progression        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [═══════════ ARÈNE ACTUELLE ═══════════]                  │
│  (voir wireframe ci-dessus)                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 STATISTIQUES                                            │
│  ┌──────────┬──────────┬──────────┐                        │
│  │ 📚 Études│ 🏃 Sport │ 💼 Pro   │                        │
│  │ 450 pts  │ 280 pts  │ 145 pts  │                        │
│  └──────────┴──────────┴──────────┘                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎯 SUGGESTIONS POUR TOI                                    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📚 Tu progresses bien en maths !                    │   │
│  │    → Passe la certification "Algèbre" OpenClassroom │   │
│  │    [Voir la certification]                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🏃 Tu cours régulièrement le mardi !                │   │
│  │    → Course "10km de Paris" dans 3 semaines         │   │
│  │    [Voir l'événement]                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏆 MES BADGES (voir Phase 10)                             │
│  [Grille de badges]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Suggestions IA contextuelles
| Contexte détecté | Suggestion |
|------------------|------------|
| Beaucoup de maths | Certification OpenClassroom Maths |
| Course régulière | Événements running locaux |
| Révisions intenses | "Prends une pause, tu travailles beaucoup !" |
| Progression rapide | "Bravo, continue comme ça !" |

### Tâches techniques
- [ ] Refonte complète `app/progression/page.tsx`
- [ ] Composant `ArenaDisplay.tsx` avec animations
- [ ] Composant `ArenaUpgradeModal.tsx`
- [ ] Service `SuggestionService` pour suggestions IA
- [ ] API `/api/suggestions/personalized`
- [ ] Intégration APIs événements locaux (optionnel)
- [ ] Animations CSS/Framer Motion

### Fichiers à créer/modifier
```
app/progression/page.tsx (refonte)
components/progression/ArenaDisplay.tsx (nouveau)
components/progression/ArenaUpgradeModal.tsx (nouveau)
components/progression/SuggestionCard.tsx (nouveau)
lib/services/suggestion-service.ts (nouveau)
lib/gamification/arena-config.ts (nouveau)
```

### Critères de validation
- [ ] Arène affichée avec bon visuel
- [ ] Progression vers arène suivante visible
- [ ] Animation de montée d'arène
- [ ] Suggestions pertinentes affichées
- [ ] Stats par catégorie correctes

---

## Phase 8 : Notifications Intelligentes & Alertes 🟡

### Objectif
Notifications basées sur l'analyse du planning et du comportement utilisateur.

### Temps estimé : 2-3 jours

### Types de Notifications

#### 1. Suggestions basées sur les habitudes
```
┌─────────────────────────────────────────────────────────────┐
│ 🏃 Tempo a remarqué...                              [×]    │
│                                                             │
│ Tu cours souvent le mardi ! Il y a une course              │
│ "Les Foulées de Paris" dans 3 semaines.                    │
│                                                             │
│ [Voir l'événement] [Ignorer]                               │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ 📚 Suggestion pour toi                              [×]    │
│                                                             │
│ Tu révises beaucoup les maths ces derniers temps !         │
│ Passe la certification "Fondamentaux Maths"                │
│ sur OpenClassroom (+50 XP bonus)                           │
│                                                             │
│ [Voir la certification] [Plus tard]                        │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Alertes bien-être (détection surmenage)
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Hey, tout va bien ?                              [×]    │
│                                                             │
│ Ton planning est très chargé cette semaine                 │
│ (45h planifiées). Tu n'es pas surmené(e) ?                 │
│                                                             │
│ [Ça va, merci !] [Propose-moi une pause]                   │
└─────────────────────────────────────────────────────────────┘
```

Si "Propose-moi une pause" :
```
┌─────────────────────────────────────────────────────────────┐
│ 🌳 Prends soin de toi                               [×]    │
│                                                             │
│ Voici quelques idées :                                     │
│ • Une balade au Parc des Buttes-Chaumont (2km)            │
│ • Un café avec des amis ☕                                 │
│ • 20 min de méditation 🧘                                  │
│                                                             │
│ [Ajouter une pause au planning]                            │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Notifications de progression
```
┌─────────────────────────────────────────────────────────────┐
│ 🏆 Bravo !                                          [×]    │
│                                                             │
│ Tu as gagné 5 badges cette semaine !                       │
│ Continue comme ça, tu es sur la bonne voie 💪              │
│                                                             │
│ [Voir mes badges]                                          │
└─────────────────────────────────────────────────────────────┘
```

### Logique de déclenchement
| Trigger | Condition | Notification |
|---------|-----------|--------------|
| Habitude sport | ≥3 mêmes jours en 4 semaines | Suggestion événement |
| Habitude études | ≥10h même matière en 2 semaines | Suggestion certification |
| Surmenage | >40h/semaine planifiées | Alerte bien-être |
| Inactivité | 0 événement en 7 jours | "Tu nous manques" |
| Progression | +100 trophées en 7 jours | Félicitations |
| Badges | +3 badges en 7 jours | Notification badges |

### Tâches techniques
- [ ] Service `NotificationTriggerService`
- [ ] Analyse patterns de planning
- [ ] Table `Notification` en Prisma
- [ ] API `/api/notifications`
- [ ] Push notifications (Web Push API)
- [ ] Composant `NotificationCenter.tsx`
- [ ] Préférences de notification par type

### Fichiers à créer
```
lib/services/notification-trigger.ts (nouveau)
lib/services/pattern-analyzer.ts (nouveau)
components/notifications/NotificationCenter.tsx (améliorer)
app/api/notifications/route.ts (améliorer)
```

### Critères de validation
- [ ] Détection patterns correcte
- [ ] Notifications pertinentes
- [ ] Push notifications fonctionnelles
- [ ] Préférences respectées
- [ ] Pas de spam (cooldown entre notifs)

---

## Phase 9 : Détection Seuils & Suggestions Contextuelles 🟡

### Objectif
Déclencher des actions automatiques basées sur des seuils configurables.

### Temps estimé : 1-2 jours

### Seuils prédéfinis
| Seuil | Condition | Action déclenchée |
|-------|-----------|-------------------|
| Surmenage | >40h/semaine | Alerte bien-être |
| Inactivité sport | 0 sport en 14 jours | Suggestion activité |
| Inactivité études | 0 études en 7 jours | Rappel objectifs |
| Streak | 7 jours consécutifs actifs | Badge "Régularité" |
| Progression rapide | +100 🏆 en 7 jours | Célébration |
| Stagnation | 0 🏆 en 14 jours | Motivation |

### Configuration utilisateur
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Mes seuils d'alerte                                     │
│                                                             │
│ Surmenage                                                   │
│ M'alerter si je planifie plus de : [40] heures/semaine     │
│                                                             │
│ Inactivité sport                                           │
│ Me rappeler si pas de sport depuis : [14] jours            │
│                                                             │
│ Inactivité études                                          │
│ Me rappeler si pas de révision depuis : [7] jours          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tâches techniques
- [ ] Table `UserThreshold` en Prisma
- [ ] Service `ThresholdChecker` (cron quotidien)
- [ ] Interface configuration seuils
- [ ] Intégration avec NotificationTriggerService

### Fichiers à créer
```
lib/services/threshold-checker.ts (nouveau)
components/settings/ThresholdSettings.tsx (nouveau)
```

---

## Phase 10 : Badges Savoirs-être 🔴

### Objectif
Système de badges basé sur les 16 savoirs-être professionnels France Travail + système d'invitation/recommandation.

### Temps estimé : 3-4 jours

### Les 16 Savoirs-être

| # | Savoir-être | Icône | Comment le gagner |
|---|-------------|-------|-------------------|
| 1 | Être à l'écoute | 🎧 | Répondre à un quiz, aider un ami |
| 2 | Faire preuve de curiosité | 🔍 | Explorer nouvelles matières, certifications |
| 3 | Faire preuve de leadership | 👑 | Organiser événements groupe |
| 4 | Faire preuve de réactivité | ⚡ | Valider événements rapidement |
| 5 | Organiser son travail | 📋 | Planning régulier, respect deadlines |
| 6 | Travailler en équipe | 🤝 | Événements collaboratifs |
| 7 | Faire preuve d'autonomie | 🦅 | Créer ses propres programmes |
| 8 | S'adapter aux changements | 🔄 | Modifier planning, rebondir |
| 9 | Prendre des initiatives | 💡 | Proposer objectifs, créer challenges |
| 10 | Gérer son stress | 🧘 | Événements bien-être, pauses |
| 11 | Faire preuve de persévérance | 💪 | Streaks, terminer événements difficiles |
| 12 | Faire preuve de rigueur | 🎯 | Quiz 100%, régularité |
| 13 | Inspirer, donner du sens | ✨ | Inviter des amis |
| 14 | Avoir le sens du service | 🤲 | Recommander des amis |
| 15 | Respecter ses engagements | ✅ | Valider tous les événements planifiés |
| 16 | Faire preuve de créativité | 🎨 | Événements variés, personnalisation |

### Affichage des Badges

```
┌─────────────────────────────────────────────────────────────┐
│ 🏆 MES BADGES SAVOIRS-ÊTRE                                 │
│                                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ 🎧  │ │ 🔍  │ │ 👑  │ │ ⚡  │ │ 📋  │ │ 🤝  │           │
│ │ Lv3 │ │ Lv2 │ │ Lv1 │ │ Lv4 │ │ Lv5 │ │ Lv2 │           │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ 🦅  │ │ 🔄  │ │ 💡  │ │ 🧘  │ │ 💪  │ │ 🎯  │           │
│ │ Lv1 │ │ Lv0 │ │ Lv2 │ │ Lv1 │ │ Lv6 │ │ Lv3 │           │
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘           │
│                                                             │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                           │
│ │ ✨  │ │ 🤲  │ │ ✅  │ │ 🎨  │                           │
│ │ Lv2 │ │ Lv3 │ │ Lv4 │ │ Lv1 │                           │
│ └─────┘ └─────┘ └─────┘ └─────┘                           │
│                                                             │
│ Clique sur un badge pour voir les détails                  │
└─────────────────────────────────────────────────────────────┘
```

### Détail d'un Badge

```
┌─────────────────────────────────────────────────────────────┐
│                     💪 PERSÉVÉRANCE                         │
│                        Niveau 6                             │
│                                                             │
│  ████████████████████░░░░  78% vers niveau 7               │
│                                                             │
│  Comment tu l'as gagné :                                   │
│  • 12 streaks de 7 jours                                   │
│  • 45 événements "difficiles" terminés                     │
│  • 3 recommandations d'amis                                │
│                                                             │
│  Pour monter au niveau 7 :                                 │
│  • Maintiens un streak de 14 jours                         │
│  • Termine 10 événements "difficiles" de plus              │
│                                                             │
│                       [Fermer]                              │
└─────────────────────────────────────────────────────────────┘
```

### Système d'Invitation & Recommandation (Style LinkedIn)

#### Flow d'invitation
```
User A invite User B
          ↓
User B reçoit lien d'invitation
          ↓
User B s'inscrit via le lien
          ↓
Lors de la création du compte de User B :

┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  👋 Bienvenue sur Tempo !                                   │
│                                                             │
│  Tu as été invité(e) par [User A] !                        │
│                                                             │
│  Quel savoir-être décrit le mieux [User A] ?               │
│                                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          │
│  │ 💪  │ │ 🎯  │ │ 🤝  │ │ 🔍  │                          │
│  │Persé│ │Rigu │ │Équip│ │Curio│                          │
│  └─────┘ └─────┘ └─────┘ └─────┘                          │
│                                                             │
│  [Choisir] ou [Passer]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
          ↓
User A reçoit notification :
"[User B] t'a recommandé pour 'Persévérance' ! +50 pts"
```

### Attribution automatique via Analyse Rétroactive (Phase 3)

| Pattern détecté | Badge attribué | Points |
|-----------------|----------------|--------|
| Planning régulier (>3 sem) | 📋 Organisation | 20 |
| Beaucoup de sport | 💪 Persévérance | 15 |
| Événements variés | 🔍 Curiosité | 10 |
| Révisions régulières | 🎯 Rigueur | 15 |
| Événements groupe | 🤝 Équipe | 10 |

### Prisma Schema

```prisma
model Badge {
  id          String   @id @default(cuid())
  code        String   @unique  // "perseverance", "curiosity", etc.
  name        String             // "Persévérance"
  description String
  icon        String             // "💪"
  category    String             // "soft_skill"
  
  userBadges  UserBadge[]
}

model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  badgeId   String
  level     Int      @default(0)  // 0-10
  points    Int      @default(0)
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id])
  badge     Badge    @relation(fields: [badgeId], references: [id])
  
  @@unique([userId, badgeId])
}

model Invitation {
  id           String   @id @default(cuid())
  inviterId    String
  code         String   @unique
  email        String?
  usedByUserId String?
  usedAt       DateTime?
  createdAt    DateTime @default(now())
  
  inviter      User     @relation("Invitations", fields: [inviterId], references: [id])
  usedBy       User?    @relation("InvitedBy", fields: [usedByUserId], references: [id])
}

model BadgeRecommendation {
  id            String   @id @default(cuid())
  fromUserId    String
  toUserId      String
  badgeId       String
  createdAt     DateTime @default(now())
  
  fromUser      User     @relation("RecommendationsSent", fields: [fromUserId], references: [id])
  toUser        User     @relation("RecommendationsReceived", fields: [toUserId], references: [id])
  badge         Badge    @relation(fields: [badgeId], references: [id])
}
```

### Tâches techniques
- [ ] Seed des 16 badges
- [ ] Service `BadgeService` pour attribution
- [ ] Intégration avec analyse rétroactive
- [ ] Système d'invitation avec codes
- [ ] Flow de recommandation à l'inscription
- [ ] Composant `BadgeGrid.tsx`
- [ ] Composant `BadgeDetail.tsx`
- [ ] API `/api/badges/*`
- [ ] API `/api/invitations/*`

### Fichiers à créer
```
lib/services/badge-service.ts (nouveau)
lib/services/invitation-service.ts (nouveau)
components/badges/BadgeGrid.tsx (nouveau)
components/badges/BadgeDetail.tsx (nouveau)
components/badges/BadgeRecommendation.tsx (nouveau)
app/api/badges/route.ts (nouveau)
app/api/invitations/route.ts (nouveau)
app/invite/[code]/page.tsx (nouveau)
prisma/seed-badges.ts (nouveau)
```

### Critères de validation
- [ ] 16 badges affichés avec niveaux
- [ ] Attribution automatique fonctionne
- [ ] Système d'invitation fonctionnel
- [ ] Recommandation à l'inscription
- [ ] Points ajoutés correctement

---

## Phase 11 : Challenges & Objectifs 🟡

### Objectif
Challenges personnalisés selon envies, parcours et compétences de l'utilisateur.

### Temps estimé : 2-3 jours

### Types de Challenges

#### Challenges Hebdomadaires (générés automatiquement)
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 CHALLENGES DE LA SEMAINE                                │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📚 Révise 5h de maths                               │    │
│ │ ████████░░░░░░░░  3h/5h                             │    │
│ │ Récompense : +100 XP                                │    │
│ │ Expire dans 4 jours                                 │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🏃 Fais 3 séances de sport                          │    │
│ │ ██████████████░░  2/3 séances                       │    │
│ │ Récompense : +75 XP                                 │    │
│ │ Expire dans 4 jours                                 │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ ✅ Valide tous tes événements                       │    │
│ │ ████████████████  8/8 validés ✓                     │    │
│ │ +50 XP gagnés !                                     │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Challenges Mensuels
```
┌─────────────────────────────────────────────────────────────┐
│ 🏆 CHALLENGE DU MOIS                                       │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📜 Passe une certification                          │    │
│ │ Récompense : +500 XP + Badge "Certifié"            │    │
│ │ Expire le 31 décembre                               │    │
│ │                                                     │    │
│ │ [Voir les certifications suggérées]                 │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Objectifs Personnels (créés par l'utilisateur)
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 CRÉER UN OBJECTIF                                       │
│                                                             │
│ Quel est ton objectif ?                                    │
│ [Je veux courir un marathon en juin________________]       │
│                                                             │
│ Catégorie : [🏃 Sport ▼]                                   │
│                                                             │
│ Date limite : [📅 15 juin 2025]                            │
│                                                             │
│ [Créer l'objectif]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
          ↓
Tempo génère automatiquement :
- Programme d'entraînement progressif
- Jalons intermédiaires (5km, 10km, semi...)
- Récompenses à chaque jalon
```

### Génération IA des Challenges

Basé sur :
- Préférences onboarding (matières, sport)
- Historique des événements
- Niveau actuel (arène)
- Badges les moins développés

```typescript
interface ChallengeGeneration {
  userPreferences: UserPreferences;
  recentEvents: Event[];
  currentArena: number;
  weakestBadges: Badge[];
}
// → Génère 3-5 challenges personnalisés
```

### Tâches techniques
- [ ] Table `Challenge` et `UserChallenge`
- [ ] Service `ChallengeGenerationService`
- [ ] Génération hebdomadaire automatique (cron)
- [ ] Interface création objectifs personnels
- [ ] Suivi progression challenges
- [ ] Récompenses automatiques

### Fichiers à créer
```
lib/services/challenge-service.ts (nouveau)
components/challenges/ChallengeCard.tsx (nouveau)
components/challenges/ObjectiveCreator.tsx (nouveau)
app/api/challenges/route.ts (nouveau)
```

---

## Phase 12 : Paramètres 🟢

### Objectif
Configuration intelligente de toutes les fonctionnalités implémentées.

### Temps estimé : 1-2 jours

### Structure des Paramètres

```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ PARAMÈTRES                                              │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 👤 Profil                                           │    │
│ │ • Reconfigurer le questionnaire                     │    │
│ │ • Modifier mes matières                             │    │
│ │ • Modifier mon sport                                │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🔔 Notifications                                    │    │
│ │ • Suggestions habitudes         [ON/OFF]            │    │
│ │ • Alertes bien-être             [ON/OFF]            │    │
│ │ • Rappels événements            [ON/OFF]            │    │
│ │ • Notifications progression     [ON/OFF]            │    │
│ │ • Heure de notification         [08:00]             │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🎮 Gamification                                     │    │
│ │ • Afficher les badges           [ON/OFF]            │    │
│ │ • Afficher les trophées         [ON/OFF]            │    │
│ │ • Afficher les challenges       [ON/OFF]            │    │
│ │ • Animations de montée          [ON/OFF]            │    │
│ │ • Mode discret (tout masquer)   [ON/OFF]            │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ ⚠️ Seuils d'alerte                                  │    │
│ │ • Surmenage : [40] heures/semaine                   │    │
│ │ • Inactivité sport : [14] jours                     │    │
│ │ • Inactivité études : [7] jours                     │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🔒 Confidentialité                                  │    │
│ │ • Contenu personnalisé          [ON/OFF]            │    │
│ │ • Offres promotionnelles        [ON/OFF]            │    │
│ │ • Partage données anonymisées   [ON/OFF]            │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🔗 Intégrations                                     │    │
│ │ • Google Calendar               [Connecté ✓]        │    │
│ │ • Strava                        [Non connecté]      │    │
│ │ • Google Drive                  [Non connecté]      │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 🛠️ Développement (dev only)                         │    │
│ │ • Reset onboarding                                  │    │
│ │ • Reset COMPLET + Déconnexion                       │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tâches techniques
- [ ] Réorganiser `SettingsPanel.tsx`
- [ ] Nouveaux toggles pour gamification
- [ ] Mode "discret" global
- [ ] Seuils configurables
- [ ] Sync temps réel des préférences

---

# 📅 PLANNING D'EXÉCUTION

## Vue Semaine par Semaine

| Semaine | Phases | Livrables clés |
|---------|--------|----------------|
| **S1** | Phase 5 | Création événement IA avec propositions |
| **S2** | Phase 6 | Validation fin événement + QCM |
| **S3** | Phase 7 | Page progression Clash Royale |
| **S4** | Phase 8 + 9 | Notifications intelligentes + Seuils |
| **S5** | Phase 10 | Badges savoirs-être + Invitations |
| **S6** | Phase 11 + 12 | Challenges + Paramètres |

## Process de Développement

Pour chaque phase :
1. ✅ Lecture du plan détaillé
2. 🛠️ Implémentation
3. 🧪 Tests manuels
4. 🔍 Audit avec checklist
5. 🐛 Fix bugs
6. ➡️ Phase suivante

---

# 📋 CHECKLIST GLOBALE

```
PHASES TERMINÉES
[x] Phase 1 : OAuth & Authentification
[x] Phase 2 : Onboarding & Questionnaire
[x] Phase 3 : Analyse Rétroactive

PHASES À FAIRE
[ ] Phase 4 : Home (peaufinage)
[ ] Phase 5 : Création Événement IA
[ ] Phase 6 : Validation Fin d'Événement
[ ] Phase 7 : Page Progression Clash Royale
[ ] Phase 8 : Notifications Intelligentes
[ ] Phase 9 : Détection Seuils
[ ] Phase 10 : Badges Savoirs-être
[ ] Phase 11 : Challenges & Objectifs
[ ] Phase 12 : Paramètres
```

---

*Document de référence - Ne pas modifier sans discussion*
*Dernière mise à jour : 18 décembre 2024*


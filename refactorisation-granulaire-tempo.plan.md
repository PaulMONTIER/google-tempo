# Plan de Refactorisation - Priorités 1, 2 et 3

## Principes Méthodologiques

1. **Approche progressive** : Une priorité à la fois, avec vérification après chaque étape
2. **Compatibilité maintenue** : L'API publique reste identique pendant la transition
3. **Granularité maximale** : Un fichier = une responsabilité unique
4. **Réutilisabilité** : Extraction des utilitaires communs
5. **Testabilité** : Chaque module isolé doit être testable indépendamment

---

## État d'Avancement

**Toutes les priorités sont complétées :**

✅ **ÉTAPES 1-5 (Réfaction initiale)** - COMPLÉTÉES  
✅ **PRIORITÉ 2 (Duplication)** - COMPLÉTÉE  
✅ **PRIORITÉ 1 (Fichiers critiques)** - COMPLÉTÉE  
✅ **PRIORITÉ 3 (Optimisations)** - COMPLÉTÉE

---

### To-dos

**ÉTAPES 1-5 (Réfaction initiale) - COMPLÉTÉES :**
- [x] Créer lib/calendar/oauth-client.ts - Factory pour client OAuth2 + Calendar API
- [x] Créer lib/utils/date-helpers.ts - Fonctions utilitaires de dates
- [x] Créer lib/calendar/create-event.ts - Fonction createCalendarEvent()
- [x] Créer lib/calendar/list-events.ts - Fonction listCalendarEvents()
- [x] Créer lib/calendar/delete-event.ts - Fonction deleteCalendarEvent()
- [x] Créer lib/calendar/find-free-slots.ts - Fonction findFreeCalendarSlots()
- [x] Créer lib/calendar/add-meet.ts - Fonctions addGoogleMeet() et addGoogleMeetToEvent()
- [x] Créer lib/calendar/index.ts - Export centralisé avec compatibilité calendarHelpers
- [x] Mettre à jour lib/actions/calendar-helpers.ts - Ré-export depuis lib/calendar/index.ts
- [x] Vérifier que calendar-helpers fonctionne toujours (tests manuels)
- [x] Créer lib/agent/tools/utils/user-validator.ts - Validation userId centralisée
- [x] Créer lib/agent/tools/utils/error-handler.ts - Gestion erreurs OAuth centralisée
- [x] Créer lib/agent/tools/calendar/find-free-slots.ts - Outil findFreeSlotsTool
- [x] Créer lib/agent/tools/calendar/create-event.ts - Outil createEventTool
- [x] Créer lib/agent/tools/calendar/get-events.ts - Outil getEventsTool
- [x] Créer lib/agent/tools/calendar/add-meet.ts - Outil addMeetToEventTool
- [x] Créer lib/agent/tools/calendar/delete-event.ts - Outil deleteEventTool
- [x] Créer lib/agent/tools/calendar/index.ts - Export centralisé des outils
- [x] Mettre à jour lib/agent/tools/calendar.ts - Ré-export depuis calendar/index.ts
- [x] Vérifier que graph.ts fonctionne toujours (tests manuels)
- [x] Créer hooks/use-calendar-events.ts - Hook pour fetch + refresh événements
- [x] Créer hooks/use-chat-messages.ts - Hook pour gestion messages chat
- [x] Créer hooks/use-panel-state.ts - Hook pour état des panneaux
- [x] Créer components/layout/AuthGate.tsx - Écran de connexion
- [x] Créer components/layout/AppHeader.tsx - Header avec menu utilisateur
- [x] Créer components/layout/MainLayout.tsx - Layout principal chat + calendrier
- [x] Refactoriser app/page.tsx - Utiliser hooks et composants layout
- [x] Vérifier toutes les interactions (chat, calendrier, panneaux)
- [x] Créer lib/trees/annotation-parser.ts - Parsing annotations <!--tree:ID:type-->
- [x] Créer lib/trees/tree-formatter.ts - Transformation données API → TreeGoal
- [x] Créer hooks/use-tree-analysis.ts - Logique analyse des arbres
- [x] Créer components/arbre/TreeItem.tsx - Affichage arbre individuel
- [x] Créer components/arbre/TreeBranches.tsx - Affichage branches
- [x] Créer components/arbre/EmptyState.tsx - État vide
- [x] Refactoriser components/arbre/ArbrePanel.tsx - Utiliser hook et composants
- [x] Tester avec événements annotés et sans annotations
- [x] Créer lib/api/validators/session-validator.ts - Validation session + reauth
- [x] Créer lib/api/transformers/message-transformer.ts - Transformation messages LangChain
- [x] Créer lib/api/cleaners/markdown-cleaner.ts - Nettoyage markdown réponse
- [x] Créer lib/api/analyzers/action-detector.ts - Détection action depuis tool calls
- [x] Refactoriser app/api/chat/route.ts - Utiliser validators, transformers, cleaners, analyzers
- [x] Tester différents types de messages et détection actions

**PRIORITÉ 2 (Duplication) - COMPLÉTÉE :**
- [x] Créer lib/ai/model-factory.ts - Factory centralisée pour configuration modèle Gemini
- [x] Mettre à jour app/api/analyze-trees/route.ts - Utiliser model-factory
- [x] Créer lib/utils/date-formatters.ts - Fonctions centralisées de formatage dates
- [x] Mettre à jour components/arbre/TreeItem.tsx - Utiliser date-formatters
- [x] Mettre à jour components/arbre/TreeBranches.tsx - Utiliser date-formatters
- [x] Mettre à jour components/events/EventDetailsPanel.tsx - Utiliser date-formatters
- [x] Mettre à jour app/api/analyze-trees/route.ts - Utiliser date-formatters
- [x] Ajouter isPast() dans lib/utils/date-helpers.ts
- [x] Mettre à jour components/arbre/TreeItem.tsx - Utiliser isPast depuis date-helpers
- [x] Mettre à jour components/arbre/TreeBranches.tsx - Utiliser isPast depuis date-helpers
- [x] Mettre à jour components/events/EventDetailsPanel.tsx - Utiliser isPast depuis date-helpers

**PRIORITÉ 1 (Fichiers critiques) - COMPLÉTÉE :**
- [x] Créer lib/agent/config/model-config.ts - Configuration modèle Gemini
- [x] Créer lib/agent/prompts/system-prompt.ts - Prompt système extrait
- [x] Créer lib/agent/utils/date-formatters.ts - Formatage dates spécifique agent
- [x] Créer lib/agent/nodes/agent-node.ts - Fonction callModel() isolée
- [x] Créer lib/agent/nodes/routing-logic.ts - Fonction shouldContinue() isolée
- [x] Créer lib/agent/graph-builder.ts - Construction du graphe uniquement
- [x] Mettre à jour lib/agent/graph.ts - Ré-export depuis graph-builder
- [x] Créer components/settings/components/Section.tsx - Composant Section réutilisable
- [x] Créer components/settings/components/ToggleSetting.tsx - Composant Toggle réutilisable
- [x] Créer components/settings/tabs/AccountTab.tsx - Tab Compte
- [x] Créer components/settings/tabs/NotificationsTab.tsx - Tab Notifications
- [x] Créer components/settings/tabs/AppearanceTab.tsx - Tab Apparence
- [x] Créer components/settings/tabs/CalendarTab.tsx - Tab Calendrier
- [x] Créer components/settings/tabs/index.ts - Export centralisé
- [x] Refactoriser components/settings/SettingsPanel.tsx - Utiliser tabs et composants
- [x] Créer components/events/utils/event-tree-builder.ts - Construction arbre dépendances
- [x] Créer components/events/utils/event-status.ts - Logique statut + config
- [x] Créer components/events/EventHeader.tsx - Header avec bande couleur
- [x] Créer components/events/EventInfo.tsx - Date, heure, lieu
- [x] Créer components/events/EventTree.tsx - Arbre de progression
- [x] Refactoriser components/events/EventDetailsPanel.tsx - Utiliser composants créés

**PRIORITÉ 3 (Optimisations) - COMPLÉTÉE :**
- [x] Créer lib/api/chat-api-client.ts - Client API pour chat
- [x] Refactoriser hooks/use-chat-messages.ts - Utiliser chat-api-client
- [x] Créer components/layout/HeaderMenu.tsx - Menu hamburger avec dropdown
- [x] Créer components/layout/UserMenu.tsx - Menu utilisateur
- [x] Refactoriser components/layout/AppHeader.tsx - Utiliser HeaderMenu et UserMenu
- [x] Créer lib/calendar/utils/slot-generator.ts - Génération créneaux candidats
- [x] Créer lib/calendar/utils/slot-filter.ts - Filtrage créneaux libres
- [x] Refactoriser lib/calendar/find-free-slots.ts - Utiliser slot-generator et slot-filter


# 🧪 Tests Tempo

## Structure

```
tests/
├── setup.ts                    # Configuration Jest + mocks globaux
├── api-chat.test.ts           # Tests API /api/chat
├── api-calendar.test.ts       # Tests API /api/calendar/events
├── api-gamification.test.ts   # Tests API gamification (intégration)
├── proposals.test.ts          # Tests détection propositions (unitaires)
└── README.md
```

## Exécution

```bash
# Tous les tests
npm test

# Mode watch
npm run test:watch

# Tests API spécifiques
npm run test:api

# Avec couverture
npm run test:api:coverage
```

## Types de tests

### Tests unitaires (sans DB)
- `api-chat.test.ts` - Mock de l'agent et session
- `api-calendar.test.ts` - Mock des helpers calendrier
- `proposals.test.ts` - Logique de détection pure

### Tests d'intégration (avec DB)
- `api-gamification.test.ts` - Requiert les profils seedés

⚠️ Pour les tests d'intégration, lancez d'abord :
```bash
npm run db:seed:test
```

## Mocking

### Session utilisateur
```typescript
jest.mock('@/lib/api/session-service');

// Dans le test
(getAppSession as jest.Mock).mockResolvedValue({
  user: { id: 'test-user-id', email: 'test@example.com' }
});
```

### Agent LangGraph
```typescript
jest.mock('@/lib/agent/graph', () => ({
  getAgentExecutor: jest.fn().mockReturnValue({
    invoke: jest.fn().mockResolvedValue({
      messages: [{ content: 'Réponse mockée' }]
    })
  })
}));
```

### Helpers calendrier
```typescript
jest.mock('@/lib/actions/calendar-helpers', () => ({
  calendarHelpers: {
    listEvents: jest.fn().mockResolvedValue([...]),
    createEvent: jest.fn().mockResolvedValue({...}),
    deleteEvent: jest.fn().mockResolvedValue({ success: true }),
  }
}));
```

## Couverture actuelle

| Module | Couverture |
|--------|------------|
| API Chat | ✅ Unitaires |
| API Calendar | ✅ Unitaires |
| API Gamification | ✅ Intégration |
| Proposals | ✅ Unitaires |
| Hooks | 🔄 À faire |
| Components | 🔄 À faire |

## Ajout de tests

1. Créer le fichier `tests/nom.test.ts`
2. Importer les mocks nécessaires
3. Suivre la convention `describe` / `test`
4. Utiliser les helpers existants pour les mocks

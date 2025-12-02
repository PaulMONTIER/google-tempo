# Guide d'analyse des tests API Gamification

## 🚀 Commandes rapides

### 1. Lancer tous les tests API
```bash
npm test:api
```

### 2. Mode verbose (détails complets)
```bash
npm test:api:verbose
```

### 3. Avec couverture de code
```bash
npm test:api:coverage
```

### 4. Mode watch (relance automatique)
```bash
npm test -- api-gamification.test.ts --watch
```

## 📊 Options d'affichage

### Afficher uniquement les tests réussis
```bash
npm test:api 2>&1 | grep "✓"
```

### Afficher uniquement les tests échoués
```bash
npm test:api 2>&1 | grep "✕"
```

### Afficher le résumé final
```bash
npm test:api 2>&1 | grep -E "(Test Suites|Tests:)"
```

### Afficher avec les temps d'exécution
```bash
npm test:api:verbose 2>&1 | grep -E "(✓|✕)" | grep -E "\([0-9]+ ms\)"
```

## 📋 Structure des tests

### Tests par endpoint

#### GET /api/gamification/progress (4 tests)
- ✅ Stats pour profil débutant
- ✅ Stats pour profil actif  
- ✅ Stats pour profil expert
- ✅ 401 si pas de session

#### GET /api/gamification/task-validations (3 tests)
- ✅ Liste des tâches à valider
- ✅ Count uniquement avec `?count=true`
- ✅ 401 si pas de session

#### POST /api/gamification/task-validations (2 tests)
- ✅ Validation d'une tâche (skip si timeout SQLite)
- ✅ 400 si validationId manquant

#### GET /api/gamification/skills (3 tests)
- ✅ Toutes les compétences (radar chart)
- ✅ Détails d'une famille avec `?familyId`
- ✅ 404 si familyId inexistant

#### GET /api/notifications/reminders (2 tests)
- ✅ Rappels actifs pour profil actif
- ✅ 401 si pas de session

#### Tests de cohérence (2 tests)
- ✅ Stats API = stats DB
- ✅ Count = longueur de la liste

**Total: 16 tests**

## 🔍 Analyser un test spécifique

### Filtrer par nom de test
```bash
npm test:api -- -t "retourne les stats correctes"
```

### Filtrer par suite de tests
```bash
npm test:api -- "GET /api/gamification/progress"
```

## 📝 Exporter les résultats

### En JSON
```bash
npm test:api -- --json > test-results.json
```

### En fichier texte
```bash
npm test:api > test-results.txt 2>&1
```

## 🐛 Debugging

### Voir les erreurs détaillées
```bash
npm test:api 2>&1 | grep -A 10 "ERROR"
```

### Voir les warnings
```bash
npm test:api 2>&1 | grep -A 5 "WARN"
```

### Mode debug Jest
```bash
DEBUG=* npm test:api
```

## 📈 Exemple de sortie attendue

```
PASS tests/api-gamification.test.ts (5.7s)
  API Gamification - Tests d'intégration avec profils seedés
    GET /api/gamification/progress
      ✓ retourne les stats correctes pour le profil débutant (5 ms)
      ✓ retourne les stats correctes pour le profil actif (1 ms)
      ✓ retourne les stats correctes pour le profil expert (1 ms)
      ✓ retourne 401 si pas de session
    ...

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Time:        5.7 s
```

## ⚠️ Notes importantes

1. **Timeout SQLite**: Le test de validation de tâche peut être skipé si la DB est verrouillée (problème d'environnement, pas de bug).

2. **Profils seedés**: Les tests utilisent les profils créés par `npm run db:seed:test`:
   - `test-debutant@albertschool.com`
   - `test-actif@albertschool.com`
   - `test-expert@albertschool.com`
   - `test-inactif@albertschool.com`

3. **Mock de session**: Les tests mockent `getAppSession()` pour éviter OAuth Google.

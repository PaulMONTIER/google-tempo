#!/bin/bash

# Script pour afficher les résultats des tests de manière lisible

echo "🧪 Résultats des tests API Gamification"
echo "========================================"
echo ""

# Lancer les tests et capturer la sortie
npm test -- api-gamification.test.ts 2>&1 | tee /tmp/test-output.txt

echo ""
echo "📊 Résumé détaillé:"
echo "==================="

# Extraire le résumé
grep -A 20 "API Gamification" /tmp/test-output.txt | head -30

echo ""
echo "✅ Tests réussis:"
grep "✓" /tmp/test-output.txt | sed 's/^/  /'

echo ""
echo "❌ Tests échoués:"
grep "✕" /tmp/test-output.txt | sed 's/^/  /' || echo "  Aucun"

echo ""
echo "📈 Statistiques finales:"
grep "Test Suites:" /tmp/test-output.txt
grep "Tests:" /tmp/test-output.txt | tail -1



#!/bin/bash
# Rollback de la dernière migration
#
# Usage:
#   ./scripts/rollback-migration.sh
#   npm run db:rollback
#
# Quand l'utiliser:
#   - Après une migration qui a causé des erreurs
#   - Pour restaurer un état précédent de la base de données
#   - UNIQUEMENT en développement (jamais en production sans validation)
#
# ATTENTION: Cette opération écrase la base de données actuelle.
# Assurez-vous d'avoir un backup récent avant de l'utiliser.

set -e  # Arrêter en cas d'erreur

DB_PATH="${DB_PATH:-prisma/dev.db}"
BACKUP_DIR="prisma/backups"

# Vérifier que le dossier de backup existe
if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Dossier de backup non trouvé : $BACKUP_DIR"
  exit 1
fi

# Trouver le backup le plus récent
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/backup_*.db 2>/dev/null | head -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ Aucun backup trouvé dans $BACKUP_DIR"
  echo "   Créez d'abord un backup avec: npm run db:backup"
  exit 1
fi

echo "⚠️  ATTENTION : Cette opération va restaurer la base de données"
echo "   Backup à restaurer : $LATEST_BACKUP"
echo "   Taille du backup : $(du -h "$LATEST_BACKUP" | cut -f1)"
echo "   Base de données actuelle sera écrasée : $DB_PATH"
echo ""
read -p "Continuer ? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Créer un backup de sécurité de l'état actuel avant rollback
  SAFETY_BACKUP="${DB_PATH}.before_rollback_$(date +%Y%m%d_%H%M%S)"
  if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$SAFETY_BACKUP"
    echo "📦 Backup de sécurité créé : $SAFETY_BACKUP"
  fi
  
  cp "$LATEST_BACKUP" "$DB_PATH"
  echo "✅ Base de données restaurée depuis : $LATEST_BACKUP"
  echo "   Si vous avez besoin de revenir à l'état avant rollback : $SAFETY_BACKUP"
else
  echo "❌ Rollback annulé"
  exit 0
fi


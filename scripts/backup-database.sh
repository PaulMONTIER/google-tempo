#!/bin/bash
# Backup de la base SQLite avant migration
#
# Usage:
#   ./scripts/backup-database.sh
#   npm run db:backup
#
# Quand l'utiliser:
#   - Avant toute migration Prisma (prisma migrate dev, prisma db push)
#   - Avant des modifications importantes du schéma
#   - En CI/CD avant les migrations automatiques
#
# Le backup est créé dans prisma/backups/ avec un timestamp

set -e  # Arrêter en cas d'erreur

# Chemins (utilise DB_PATH depuis env si disponible, sinon défaut)
DB_PATH="${DB_PATH:-prisma/dev.db}"
BACKUP_DIR="prisma/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.db"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

if [ -f "$DB_PATH" ]; then
  cp "$DB_PATH" "$BACKUP_FILE"
  echo "✅ Backup créé : $BACKUP_FILE"
  echo "   Taille : $(du -h "$BACKUP_FILE" | cut -f1)"
else
  echo "⚠️  Base de données non trouvée : $DB_PATH"
  echo "   Vérifiez que le chemin est correct ou que la base existe."
  exit 1
fi


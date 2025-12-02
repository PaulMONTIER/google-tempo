import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExistingUsers() {
  console.log('🔄 Migration des utilisateurs existants...');
  
  const users = await prisma.user.findMany({
    where: {
      userProgress: null, // Uniquement ceux sans progression
    },
  });
  
  console.log(`📊 ${users.length} utilisateurs à migrer`);
  
  for (const user of users) {
    await prisma.userProgress.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        totalActions: 0,
        totalTasksCreated: 0,
        totalTasksCompleted: 0,
        totalQuizzesCompleted: 0,
      },
      update: {},
    });
    
    console.log(`✅ Progression créée pour ${user.email || user.id}`);
  }
  
  console.log('✅ Migration terminée');
}

async function initializeSkillFamilies() {
  console.log('🔄 Initialisation des familles de compétences...');
  
  const families = [
    {
      id: 'academic',
      name: 'Académique',
      color: '#3b82f6',
      icon: 'Book',
      order: 1,
      keywords: JSON.stringify(['math', 'sciences', 'langues', 'histoire', 'révision', 'examen']),
    },
    {
      id: 'organization',
      name: 'Organisation',
      color: '#10b981',
      icon: 'Calendar',
      order: 2,
      keywords: JSON.stringify(['planification', 'agenda', 'deadline', 'organisation']),
    },
    {
      id: 'productivity',
      name: 'Productivité',
      color: '#f59e0b',
      icon: 'Zap',
      order: 3,
      keywords: JSON.stringify(['focus', 'efficacité', 'productivité', 'concentration']),
    },
    {
      id: 'collaboration',
      name: 'Collaboration',
      color: '#8b5cf6',
      icon: 'Users',
      order: 4,
      keywords: JSON.stringify(['réunion', 'communication', 'équipe', 'collaboration']),
    },
    {
      id: 'autonomy',
      name: 'Autonomie',
      color: '#ef4444',
      icon: 'Target',
      order: 5,
      keywords: JSON.stringify(['initiative', 'résolution', 'adaptation', 'apprentissage']),
    },
  ];
  
  for (const family of families) {
    await prisma.skillFamily.upsert({
      where: { id: family.id },
      create: family,
      update: { keywords: family.keywords }, // Mettre à jour les keywords si modifiés
    });
  }
  
  console.log('✅ Familles de compétences initialisées');
}

async function main() {
  try {
    await migrateExistingUsers();
    await initializeSkillFamilies();
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



import { PrismaClient } from '@prisma/client';
import { addDays, subDays, startOfDay } from 'date-fns';

import { calculateLevel } from '../lib/gamification/config/level-config';
import { XP_REWARDS } from '../lib/gamification/config/xp-config';
import { logger } from '../lib/utils/logger';

const prisma = new PrismaClient();

// ============================================
// Types et configuration des profils de test
// ============================================

interface TestProfile {
  email: string;
  name: string;
  targetLevel: number;
  targetXp: number;
  streakDays: number;
  totalTasks: number;
  totalQuizzes: number;
  activityStartDaysAgo: number;
}

const TEST_PROFILES: TestProfile[] = [
  {
    email: 'test-debutant@albertschool.com',
    name: 'Test Débutant',
    targetLevel: 2,
    targetXp: 150,
    streakDays: 2,
    totalTasks: 5,
    totalQuizzes: 0,
    activityStartDaysAgo: 7,
  },
  {
    email: 'test-actif@albertschool.com',
    name: 'Test Actif',
    targetLevel: 8,
    targetXp: 2500,
    streakDays: 12,
    totalTasks: 25,
    totalQuizzes: 5,
    activityStartDaysAgo: 45,
  },
  {
    email: 'test-expert@albertschool.com',
    name: 'Test Expert',
    targetLevel: 18,
    targetXp: 8000,
    streakDays: 28,
    totalTasks: 60,
    totalQuizzes: 15,
    activityStartDaysAgo: 90,
  },
  {
    email: 'test-inactif@albertschool.com',
    name: 'Test Inactif',
    targetLevel: 1,
    targetXp: 50,
    streakDays: 0,
    totalTasks: 3,
    totalQuizzes: 0,
    activityStartDaysAgo: 120,
  },
];

// ============================================
// Utilitaires
// ============================================

type GeneratedEvent = {
  eventId: string;
  title: string;
  date: Date;
  isGoal: boolean;
};

function generateEventId(prefix: string = 'evt'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/**
 * Génère une liste d'événements (goals + tâches) répartis sur une période.
 */
function generateEvents(
  startDate: Date,
  daysAgo: number,
  totalTasks: number,
): GeneratedEvent[] {
  const events: GeneratedEvent[] = [];

  const goalTitles = [
    'Examen de mathématiques',
    'Présentation de projet',
    'Rapport final',
    'Soutenance de mémoire',
    'Contrôle de physique',
  ];

  const taskTitles = [
    'Révision chapitre 1',
    'Exercices TD',
    'Préparation des slides',
    'Lecture d’articles',
    'Rédaction de l’introduction',
    'Fiches de révision',
    'Entraînement sur sujet type',
  ];

  const numGoals = Math.max(1, Math.floor(totalTasks * 0.2));
  const numTasks = Math.max(0, totalTasks - numGoals);

  // Goals répartis dans la période
  for (let i = 0; i < numGoals; i += 1) {
    const daysOffset = Math.floor((daysAgo / numGoals) * i);
    const date = subDays(startDate, daysAgo - daysOffset);
    events.push({
      eventId: generateEventId('goal'),
      title: goalTitles[i % goalTitles.length],
      date,
      isGoal: true,
    });
  }

  // Tâches de préparation réparties
  for (let i = 0; i < numTasks; i += 1) {
    const daysOffset = Math.floor((daysAgo / Math.max(1, numTasks)) * i);
    const date = subDays(startDate, daysAgo - daysOffset);
    events.push({
      eventId: generateEventId('task'),
      title: taskTitles[i % taskTitles.length],
      date,
      isGoal: false,
    });
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ============================================
// Seeding d'un profil
// ============================================

async function seedProfile(profile: TestProfile): Promise<void> {
  console.log(`\n📦 Création du profil: ${profile.name} (${profile.email})`);

  // 1. Créer / mettre à jour l'utilisateur
  const user = await prisma.user.upsert({
    where: { email: profile.email },
    create: {
      email: profile.email,
      name: profile.name,
      emailVerified: new Date(),
    },
    update: {
      name: profile.name,
    },
  });

  console.log(`  ✅ Utilisateur: ${user.id}`);

  // 2. Créer / mettre à jour la progression
  const progress = await prisma.userProgress.upsert({
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

  const startDate = new Date();
  const events = generateEvents(startDate, profile.activityStartDaysAgo, profile.totalTasks);

  console.log(`  📅 ${events.length} événements générés (${events.filter(e => e.isGoal).length} goals)`);

  let totalXpEarned = 0;
  let tasksCompleted = 0;
  const validationDates: Date[] = [];

  // 3. TaskValidation + XpHistory pour les tâches complétées
  for (const event of events) {
    const completed = Math.random() > 0.3;
    const dismissed = Math.random() > 0.9;

    const validation = await prisma.taskValidation.create({
      data: {
        userId: user.id,
        eventId: event.eventId,
        eventTitle: event.title,
        eventDate: startOfDay(event.date),
        completed,
        validatedAt: completed ? event.date : null,
        dismissed,
      },
    });

    if (validation.completed && !validation.dismissed) {
      tasksCompleted += 1;
      validationDates.push(startOfDay(event.date));

      // XP pour la création de tâche
      totalXpEarned += XP_REWARDS.TASK_CREATED;
      await prisma.xpHistory.create({
        data: {
          userProgressId: progress.id,
          amount: XP_REWARDS.TASK_CREATED,
          actionType: 'task_created',
          eventId: event.eventId,
          multiplier: 1.0,
        },
      });

      // XP pour la complétion
      totalXpEarned += XP_REWARDS.TASK_COMPLETED;
      await prisma.xpHistory.create({
        data: {
          userProgressId: progress.id,
          amount: XP_REWARDS.TASK_COMPLETED,
          actionType: 'task_completed',
          eventId: event.eventId,
          multiplier: 1.0,
        },
      });
    }
  }

  // 4. Quiz complétés à partir des goals
  const goalEvents = events.filter(e => e.isGoal);
  const quizzesToCreate = Math.min(profile.totalQuizzes, goalEvents.length);

  for (let i = 0; i < quizzesToCreate; i += 1) {
    const goal = goalEvents[i];
    const quizDate = subDays(
      startDate,
      Math.floor(profile.activityStartDaysAgo * (i / Math.max(1, quizzesToCreate))),
    );

    const series = await prisma.quizSeries.create({
      data: {
        userId: user.id,
        name: `Quiz pour ${goal.title}`,
        goalEventId: goal.eventId,
        totalQuizzes: 4,
        currentQuiz: Math.min(4, i + 1),
      },
    });

    const score = Math.floor(Math.random() * 4) + 7; // 7-10

    const quiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        eventId: goal.eventId,
        eventTitle: goal.title,
        seriesId: series.id,
        totalQuestions: 10,
        score,
        completed: true,
        completedAt: quizDate,
        context: JSON.stringify({ eventTitle: goal.title }),
        questions: {
          create: Array.from({ length: 10 }).map((_, index) => {
            const correct = index < score;
            const correctAnswer = 0;
            const userAnswer = correct ? 0 : 1;
            return {
              order: index + 1,
              question: `Question ${index + 1} sur ${goal.title}`,
              options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
              correctAnswer,
              userAnswer,
              isCorrect: correct,
              answeredAt: quizDate,
              explanation: `Explication pour la question ${index + 1}`,
            };
          }),
        },
      },
    });

    const quizXp = Math.floor(XP_REWARDS.QUIZ_COMPLETED * XP_REWARDS.QUIZ_MULTIPLIER);
    totalXpEarned += quizXp;

    await prisma.xpHistory.create({
      data: {
        userProgressId: progress.id,
        amount: quizXp,
        actionType: 'quiz_completed',
        eventId: quiz.eventId,
        multiplier: XP_REWARDS.QUIZ_MULTIPLIER,
      },
    });
  }

  // 5. Calcul des streaks à partir des dates de validation
  validationDates.sort((a, b) => a.getTime() - b.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let lastValidationDate: Date | null = null;

  for (const date of validationDates) {
    if (!lastValidationDate) {
      tempStreak = 1;
      lastValidationDate = date;
      continue;
    }

    const diffDays =
      (startOfDay(date).getTime() - startOfDay(lastValidationDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      tempStreak += 1;
    } else if (diffDays > 1) {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }

    lastValidationDate = date;
  }

  longestStreak = Math.max(longestStreak, tempStreak);

  // Forcer un streak actuel si demandé par le profil
  if (profile.streakDays > 0) {
    currentStreak = profile.streakDays;
    longestStreak = Math.max(longestStreak, currentStreak);
    lastValidationDate = startOfDay(new Date());
  } else {
    currentStreak = tempStreak;
  }

  // 6. Mise à jour finale de UserProgress
  const finalLevel = calculateLevel(totalXpEarned);

  await prisma.userProgress.update({
    where: { userId: user.id },
    data: {
      xp: totalXpEarned,
      level: finalLevel,
      currentStreak,
      longestStreak,
      lastEventValidationDate: lastValidationDate,
      totalActions: tasksCompleted + quizzesToCreate,
      totalTasksCreated: events.length,
      totalTasksCompleted: tasksCompleted,
      totalQuizzesCompleted: quizzesToCreate,
    },
  });

  // 7. Progression des compétences (familles)
  const families = await prisma.skillFamily.findMany({
    where: { isActive: true },
  });

  for (const family of families) {
    const level = Math.max(
      0,
      Math.min(
        100,
        Math.round((finalLevel / 20) * 100) + Math.floor(Math.random() * 20) - 10,
      ),
    );
    const xp = Math.max(
      0,
      Math.floor(totalXpEarned * (0.1 + Math.random() * 0.3)),
    );

    await prisma.userSkillProgress.create({
      data: {
        userId: user.id,
        skillFamilyId: family.id,
        level,
        xp,
        lastActivityAt: subDays(startDate, Math.floor(Math.random() * 7)),
      },
    });
  }

  // 8. Arbres de préparation et objectifs futurs (pour rappels)
  const futureGoals = events
    .filter(e => e.isGoal)
    .map(e => ({
      ...e,
      futureDate: addDays(startDate, Math.floor(Math.random() * 14) + 1),
    }))
    .slice(0, 2);

  for (const goal of futureGoals) {
    const tree = await prisma.preparationTree.create({
      data: {
        userId: user.id,
        treeId: `tree_${goal.eventId}`,
        goalEventId: goal.eventId,
        goalTitle: goal.title,
        goalDate: goal.futureDate,
        detectionMethod: 'ai',
        branches: {
          create: Array.from({ length: 3 }).map((_, index) => ({
            branchEventId: generateEventId('branch'),
            branchTitle: `Préparation ${index + 1} - ${goal.title}`,
            branchDate: subDays(goal.futureDate, (3 - index) * 7),
            order: index + 1,
          })),
        },
      },
    });

    logger.debug(
      `[seed-test-profiles] PreparationTree créé pour userId=${user.id}, goal=${tree.goalTitle}`,
    );
  }

  // 9. Tâches en attente récentes (pour TaskValidation panel)
  if (profile.streakDays > 0) {
    for (let i = 0; i < 3; i += 1) {
      const date = subDays(startDate, i);
      await prisma.taskValidation.create({
        data: {
          userId: user.id,
          eventId: generateEventId('pending'),
          eventTitle: `Tâche à valider ${i + 1}`,
          eventDate: startOfDay(date),
          completed: false,
          validatedAt: null,
          dismissed: false,
        },
      });
    }
  }

  console.log(
    `  🎯 Profil final: level=${finalLevel}, xp=${totalXpEarned}, streak=${currentStreak}, tasksCompleted=${tasksCompleted}, quizzes=${quizzesToCreate}`,
  );
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('🚀 Démarrage du seeding des profils de test (gamification)...\n');

  // Petite protection : avertir si DATABASE_URL semble distante
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl && !dbUrl.startsWith('file:') && !dbUrl.includes('localhost')) {
    console.warn(
      `⚠️  Attention: DATABASE_URL ne ressemble pas à une base locale (${dbUrl}). Assurez-vous de ne pas exécuter ce script sur une base de production.`,
    );
  }

  try {
    const familiesCount = await prisma.skillFamily.count();
    if (familiesCount === 0) {
      console.error(
        '❌ Aucune SkillFamily trouvée. Exécutez d’abord `npm run db:seed` pour initialiser les familles de compétences.',
      );
      return;
    }

    for (const profile of TEST_PROFILES) {
      await seedProfile(profile);
    }

    console.log('\n✅ Seeding des profils de test terminé avec succès.');
    console.log('📋 Profils créés:');
    TEST_PROFILES.forEach(p => {
      console.log(`   - ${p.email} (${p.name})`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du seeding des profils de test:', error);
    logger.error('[seed-test-profiles] Erreur:', error as Error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('❌ Erreur inattendue dans seed-test-profiles:', error);
});



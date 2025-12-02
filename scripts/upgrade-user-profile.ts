import { PrismaClient } from '@prisma/client';
import { addDays, subDays, startOfDay } from 'date-fns';

import { calculateLevel } from '../lib/gamification/config/level-config';
import { XP_REWARDS } from '../lib/gamification/config/xp-config';
import { logger } from '../lib/utils/logger';

const prisma = new PrismaClient();

/**
 * Script d'upgrade d'un compte existant vers un profil avancé (type "expert").
 *
 * Usage:
 *   npm run db:upgrade:user -- email@domaine.com
 *
 * Prérequis:
 *   - L'utilisateur doit déjà exister (créé via OAuth Google).
 *   - Les SkillFamily doivent être seedées (npm run db:seed).
 */

async function upgradeUserToExpert(email: string): Promise<void> {
  console.log(`\n🚀 Upgrade du compte ${email} vers un profil avancé...`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`❌ Utilisateur introuvable pour l'email: ${email}`);
    return;
  }

  console.log(`  ✅ User trouvé: ${user.id}`);

  const familiesCount = await prisma.skillFamily.count();
  if (familiesCount === 0) {
    console.error(
      '❌ Aucune SkillFamily trouvée. Exécutez d’abord `npm run db:seed` pour initialiser les familles de compétences.',
    );
    return;
  }

  // Nettoyer partiellement d'anciennes données de progression (optionnel mais plus propre)
  await prisma.quizQuestion.deleteMany({
    where: { quiz: { userId: user.id } },
  });
  await prisma.quiz.deleteMany({
    where: { userId: user.id },
  });
  await prisma.quizSeries.deleteMany({
    where: { userId: user.id },
  });
  await prisma.taskValidation.deleteMany({
    where: { userId: user.id },
  });
  await prisma.userSkillProgress.deleteMany({
    where: { userId: user.id },
  });
  await prisma.preparationBranch.deleteMany({
    where: { tree: { userId: user.id } },
  });
  await prisma.preparationTree.deleteMany({
    where: { userId: user.id },
  });
  await prisma.xpHistory.deleteMany({
    where: { userProgress: { userId: user.id } },
  });

  // Créer / récupérer UserProgress
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
  const activityDays = 90; // 3 mois

  // Simuler des validations quotidiennes sur 28 derniers jours pour un long streak
  let totalXpEarned = 0;
  let tasksCompleted = 0;
  const validationDates: Date[] = [];

  for (let i = 0; i < 28; i += 1) {
    const date = subDays(startDate, 27 - i);
    const eventId = `expert-streak-${i}`;

    await prisma.taskValidation.create({
      data: {
        userId: user.id,
        eventId,
        eventTitle: `Tâche de streak jour ${i + 1}`,
        eventDate: startOfDay(date),
        completed: true,
        validatedAt: date,
        dismissed: false,
      },
    });

    tasksCompleted += 1;
    validationDates.push(startOfDay(date));

    totalXpEarned += XP_REWARDS.TASK_CREATED;
    await prisma.xpHistory.create({
      data: {
        userProgressId: progress.id,
        amount: XP_REWARDS.TASK_CREATED,
        actionType: 'task_created',
        eventId,
        multiplier: 1.0,
      },
    });

    totalXpEarned += XP_REWARDS.TASK_COMPLETED;
    await prisma.xpHistory.create({
      data: {
        userProgressId: progress.id,
        amount: XP_REWARDS.TASK_COMPLETED,
        actionType: 'task_completed',
        eventId,
        multiplier: 1.0,
      },
    });
  }

  // Simuler des tâches + quiz répartis sur 3 mois
  const extraTasks = 40;
  const extraQuizzes = 8;

  for (let i = 0; i < extraTasks; i += 1) {
    const daysAgo = Math.floor((activityDays / extraTasks) * i);
    const date = subDays(startDate, activityDays - daysAgo);
    const eventId = `expert-task-${i}`;

    const completed = Math.random() > 0.2;

    await prisma.taskValidation.create({
      data: {
        userId: user.id,
        eventId,
        eventTitle: `Tâche avancée ${i + 1}`,
        eventDate: startOfDay(date),
        completed,
        validatedAt: completed ? date : null,
        dismissed: !completed && Math.random() > 0.7,
      },
    });

    if (completed) {
      tasksCompleted += 1;
      validationDates.push(startOfDay(date));

      totalXpEarned += XP_REWARDS.TASK_CREATED;
      await prisma.xpHistory.create({
        data: {
          userProgressId: progress.id,
          amount: XP_REWARDS.TASK_CREATED,
          actionType: 'task_created',
          eventId,
          multiplier: 1.0,
        },
      });

      totalXpEarned += XP_REWARDS.TASK_COMPLETED;
      await prisma.xpHistory.create({
        data: {
          userProgressId: progress.id,
          amount: XP_REWARDS.TASK_COMPLETED,
          actionType: 'task_completed',
          eventId,
          multiplier: 1.0,
        },
      });
    }
  }

  // Quiz liés à quelques tâches "goal"
  for (let i = 0; i < extraQuizzes; i += 1) {
    const quizDate = subDays(startDate, 60 - i * 5);
    const eventId = `expert-quiz-${i}`;

    const series = await prisma.quizSeries.create({
      data: {
        userId: user.id,
        name: `Série de quiz ${i + 1}`,
        goalEventId: eventId,
        totalQuizzes: 4,
        currentQuiz: Math.min(4, i + 1),
      },
    });

    const score = Math.floor(Math.random() * 4) + 7; // 7-10

    const quiz = await prisma.quiz.create({
      data: {
        userId: user.id,
        eventId,
        eventTitle: `Quiz avancé ${i + 1}`,
        seriesId: series.id,
        totalQuestions: 10,
        score,
        completed: true,
        completedAt: quizDate,
        context: JSON.stringify({ kind: 'upgrade-expert' }),
        questions: {
          create: Array.from({ length: 10 }).map((_, index) => {
            const correct = index < score;
            const correctAnswer = 0;
            const userAnswer = correct ? 0 : 1;
            return {
              order: index + 1,
              question: `Question ${index + 1} du quiz ${i + 1}`,
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

  // Calcul streaks (on force un streak long, centré sur les 28 derniers jours)
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

  currentStreak = 28;
  longestStreak = Math.max(longestStreak, currentStreak);
  lastValidationDate = startOfDay(new Date());

  const finalLevel = calculateLevel(totalXpEarned);

  await prisma.userProgress.update({
    where: { userId: user.id },
    data: {
      xp: totalXpEarned,
      level: finalLevel,
      currentStreak,
      longestStreak,
      lastEventValidationDate: lastValidationDate,
      totalActions: tasksCompleted + extraQuizzes,
      totalTasksCreated: tasksCompleted + extraTasks,
      totalTasksCompleted: tasksCompleted,
      totalQuizzesCompleted: extraQuizzes,
    },
  });

  // Compétences
  const families = await prisma.skillFamily.findMany({
    where: { isActive: true },
  });

  for (const family of families) {
    const level = Math.max(
      40,
      Math.min(
        100,
        Math.round((finalLevel / 20) * 100) + Math.floor(Math.random() * 20) - 10,
      ),
    );
    const xp = Math.max(
      0,
      Math.floor(totalXpEarned * (0.15 + Math.random() * 0.25)),
    );

    // Important: pour les entrées de famille globale (skillDetailId = null),
    // on ne peut pas utiliser upsert avec une clé composite incluant un champ nullable.
    // Comme pour le script de seeding de profils de test, on se contente de create
    // (ce script est conçu pour un usage sur base locale, ré-exécutable après reset).
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

  // Objectifs futurs pour rappels
  for (let i = 0; i < 2; i += 1) {
    const goalDate = addDays(startDate, (i + 1) * 5);

    await prisma.preparationTree.create({
      data: {
        userId: user.id,
        treeId: `upgrade-tree-${i}`,
        goalEventId: `upgrade-goal-${i}`,
        goalTitle: `Objectif important ${i + 1}`,
        goalDate,
        detectionMethod: 'manual',
        branches: {
          create: [
            {
              branchEventId: `upgrade-branch-${i}-1`,
              branchTitle: `Préparation 1 - Objectif ${i + 1}`,
              branchDate: subDays(goalDate, 14),
              order: 1,
            },
            {
              branchEventId: `upgrade-branch-${i}-2`,
              branchTitle: `Préparation 2 - Objectif ${i + 1}`,
              branchDate: subDays(goalDate, 7),
              order: 2,
            },
          ],
        },
      },
    });
  }

  console.log(
    `\n🎯 Profil avancé appliqué à ${email} (userId=${user.id}) : level=${finalLevel}, xp=${totalXpEarned}, streak=${currentStreak}`,
  );
}

async function main() {
  const [, , email] = process.argv;

  if (!email) {
    console.error('❌ Email requis. Usage: npm run db:upgrade:user -- email@domaine.com');
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl && !dbUrl.startsWith('file:') && !dbUrl.includes('localhost')) {
    console.warn(
      `⚠️  Attention: DATABASE_URL ne ressemble pas à une base locale (${dbUrl}). Assurez-vous de ne pas exécuter ce script sur une base de production.`,
    );
  }

  try {
    await upgradeUserToExpert(email);
  } catch (error) {
    console.error('❌ Erreur lors de l’upgrade du compte:', error);
    logger.error('[upgrade-user-profile] Erreur:', error as Error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error('❌ Erreur inattendue dans upgrade-user-profile:', error);
});




import { PrismaClient } from '@prisma/client';
import { addXP, getProgressStats } from '@/lib/gamification/progress-service';
import { XP_REWARDS } from '@/lib/gamification/config/xp-config';

const prisma = new PrismaClient();

describe('Gamification - Progress Service (intégration DB)', () => {
  const TEST_EMAIL = 'test-progress@example.com';

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.deleteMany({
      where: { email: TEST_EMAIL },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: TEST_EMAIL },
    });
    await prisma.$disconnect();
  });

  test('addXP est idempotent pour un même eventId et reflété par getProgressStats', async () => {
    // 1. Créer un utilisateur de test
    const user = await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: 'Test Progress',
        emailVerified: new Date(),
      },
    });

    const userId = user.id;
    const eventId = 'test-event-id-1';

    // 2. Stats initiales (getProgressStats crée UserProgress si besoin)
    const initialStats = await getProgressStats(userId);

    // 3. Appeler addXP deux fois avec le même eventId
    await addXP(userId, XP_REWARDS.TASK_COMPLETED, 'task_completed', eventId);
    await addXP(userId, XP_REWARDS.TASK_COMPLETED, 'task_completed', eventId);

    // 4. Récupérer la progression
    const stats = await getProgressStats(userId);

    // 5. Vérifier que l'XP n'a été ajouté qu'une seule fois
    const expectedGain = XP_REWARDS.TASK_COMPLETED;
    expect(stats.xp - initialStats.xp).toBe(expectedGain);

    // 6. Double-check côté DB sur UserProgress
    const dbProgress = await prisma.userProgress.findUnique({
      where: { userId },
    });
    expect(dbProgress).not.toBeNull();
    expect((dbProgress!.xp ?? 0) - initialStats.xp).toBe(expectedGain);
  });
});


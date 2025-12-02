import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Convention de mocking pour les tests nécessitant un utilisateur connecté.
 *
 * Deux options recommandées :
 *
 * 1) Mocker getAppSession (plus proche de la réalité NextAuth)
 *
 *    jest.mock('@/lib/api/session-service', () => ({
 *      getAppSession: jest.fn().mockResolvedValue({
 *        user: { id: 'test-user-id', email: 'test@example.com' },
 *      }),
 *    }));
 *
 * 2) Mocker validateSession (plus simple, côté API)
 *
 *    jest.mock('@/lib/api/validators/session-validator', () => ({
 *      validateSession: () => ({ userId: 'test-user-id', error: null }),
 *    }));
 *
 * Les routes API utilisant validateSession(session) continueront ainsi à
 * fonctionner sans dépendre d'OAuth Google pendant les tests.
 */


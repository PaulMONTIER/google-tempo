/**
 * Setup Jest pour les tests Tempo
 * 
 * Ce fichier gère la configuration globale des tests.
 * La connexion à la DB n'est initialisée que si nécessaire.
 */

// Mock global de l'auth-options pour éviter les erreurs d'import
jest.mock('@/lib/auth/auth-options', () => ({
  authOptions: {},
}));

// Variable pour tracker si on a besoin de la DB
let prismaInstance: any = null;

/**
 * Helper pour obtenir une instance Prisma (lazy loading)
 * Utilisé uniquement par les tests d'intégration
 */
export async function getPrismaForTests() {
  if (!prismaInstance) {
    const { PrismaClient } = await import('@prisma/client');
    prismaInstance = new PrismaClient();
    await prismaInstance.$connect();
  }
  return prismaInstance;
}

/**
 * Nettoyage après tous les tests
 */
afterAll(async () => {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
});

/**
 * Convention de mocking pour les tests nécessitant un utilisateur connecté.
 *
 * Option 1: Mocker getAppSession (recommandé)
 *
 *    jest.mock('@/lib/api/session-service');
 *    (getAppSession as jest.Mock).mockResolvedValue({
 *      user: { id: 'test-user-id', email: 'test@example.com' },
 *    });
 *
 * Option 2: Mocker validateSession
 *
 *    jest.mock('@/lib/api/validators/session-validator', () => ({
 *      validateSession: () => ({ userId: 'test-user-id', error: null }),
 *    }));
 */

// Suppression des logs console pendant les tests (optionnel)
// beforeAll(() => {
//   jest.spyOn(console, 'log').mockImplementation(() => {});
//   jest.spyOn(console, 'debug').mockImplementation(() => {});
// });

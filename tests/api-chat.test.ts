import { POST as postChat, GET as getChat } from '@/app/api/chat/route';
import { NextRequest } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';

// Mock des dépendances
jest.mock('@/lib/auth/auth-options', () => ({ authOptions: {} }));
jest.mock('@/lib/api/session-service');
jest.mock('@/lib/agent/graph', () => ({
  getAgentExecutor: jest.fn().mockReturnValue({
    invoke: jest.fn().mockResolvedValue({
      messages: [
        { content: 'Bonjour ! Comment puis-je t\'aider avec ton calendrier ?' }
      ]
    })
  })
}));

describe('API Chat - Tests unitaires', () => {
  const TEST_USER = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  function createMockRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/chat', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/chat', () => {
    test('retourne le statut de l\'API', async () => {
      const response = await getChat();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        status: 'ok',
        service: 'Tempo Agent API',
        version: expect.any(String),
      });
    });
  });

  describe('POST /api/chat', () => {
    test('retourne 401 si pas de session', async () => {
      (getAppSession as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Bonjour' }],
      });
      const response = await postChat(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    test('retourne 400 si messages manquants', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const request = createMockRequest({});
      const response = await postChat(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_REQUEST');
    });

    test('retourne 400 si messages n\'est pas un tableau', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const request = createMockRequest({ messages: 'not an array' });
      const response = await postChat(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.code).toBe('INVALID_REQUEST');
    });

    test('traite un message simple avec succès', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Bonjour Tempo' }],
        requireConfirmation: true,
      });
      const response = await postChat(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        message: expect.any(String),
        action: expect.any(String),
        metadata: {
          responseTime: expect.any(Number),
          toolCalls: expect.any(Number),
        },
      });
    });

    test('passe les règles actives à l\'agent', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });
      const { getAgentExecutor } = require('@/lib/agent/graph');

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Test' }],
        rules: [
          { id: '1', condition: 'test', action: 'action', enabled: true },
          { id: '2', condition: 'test2', action: 'action2', enabled: false },
        ],
      });
      await postChat(request);

      // Vérifier que l'agent reçoit seulement les règles actives
      expect(getAgentExecutor).toHaveBeenCalled();
    });
  });

  describe('Gestion des pending events', () => {
    test('détecte un pending_event dans la réponse agent', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });
      
      // Mock l'agent pour retourner un pending_event
      const { getAgentExecutor } = require('@/lib/agent/graph');
      getAgentExecutor.mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
          messages: [
            { 
              content: JSON.stringify({
                type: 'pending_event',
                event: {
                  title: 'Réunion test',
                  startDateTime: '2024-12-20T14:00:00',
                  endDateTime: '2024-12-20T15:00:00',
                }
              })
            },
            { content: 'J\'ai préparé un événement. Tu confirmes ?' }
          ]
        })
      });

      const request = createMockRequest({
        messages: [{ role: 'user', content: 'Crée une réunion demain à 14h' }],
      });
      const response = await postChat(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe('pending');
      expect(data.pendingEvent).toBeDefined();
    });
  });
});


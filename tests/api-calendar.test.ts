import { GET as getEvents } from '@/app/api/calendar/events/route';
import { POST as confirmEvent } from '@/app/api/calendar/events/confirm/route';
import { NextRequest } from 'next/server';
import { getAppSession } from '@/lib/api/session-service';

// Mock des dépendances
jest.mock('@/lib/api/session-service');

// Mock pour GET /api/calendar/events
jest.mock('@/lib/actions/calendar-helpers', () => ({
  calendarHelpers: {
    listEvents: jest.fn().mockResolvedValue([
      {
        id: 'event-1',
        title: 'Réunion test',
        startDate: new Date('2024-12-20T14:00:00'),
        endDate: new Date('2024-12-20T15:00:00'),
        color: '#2383e2',
      },
      {
        id: 'event-2',
        title: 'Déjeuner',
        startDate: new Date('2024-12-20T12:00:00'),
        endDate: new Date('2024-12-20T13:00:00'),
        color: '#10b981',
      },
    ]),
  },
}));

// Mock pour POST /api/calendar/events/confirm
jest.mock('@/lib/calendar', () => ({
  createCalendarEvent: jest.fn().mockResolvedValue({
    id: 'new-event-123',
    summary: 'Nouvel événement',
  }),
  deleteCalendarEvent: jest.fn().mockResolvedValue({ success: true }),
}));

describe('API Calendar - Tests unitaires', () => {
  const TEST_USER = {
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  function createMockRequest(url: string, method: string = 'GET', body?: any): NextRequest {
    return new NextRequest(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/calendar/events', () => {
    test('retourne 401 si pas de session', async () => {
      (getAppSession as jest.Mock).mockResolvedValue(null);

      const response = await getEvents();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    test('retourne la liste des événements', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const response = await getEvents();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.events).toBeDefined();
      expect(Array.isArray(data.events)).toBe(true);
      expect(data.events.length).toBe(2);
    });

    test('les événements ont la structure attendue', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const response = await getEvents();
      const data = await response.json();

      const event = data.events[0];
      expect(event).toMatchObject({
        id: expect.any(String),
        title: expect.any(String),
        startDate: expect.any(String),
        endDate: expect.any(String),
      });
    });
  });

  describe('POST /api/calendar/events/confirm', () => {
    test('retourne 401 si pas de session', async () => {
      (getAppSession as jest.Mock).mockResolvedValue(null);

      const request = createMockRequest(
        'http://localhost:3000/api/calendar/events/confirm',
        'POST',
        { event: { title: 'Test' }, action: 'accept' }
      );
      const response = await confirmEvent(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    test('crée un événement avec action accept', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const request = createMockRequest(
        'http://localhost:3000/api/calendar/events/confirm',
        'POST',
        {
          event: {
            title: 'Nouvelle réunion',
            startDateTime: '2024-12-21T10:00:00',
            endDateTime: '2024-12-21T11:00:00',
          },
          action: 'accept',
          actionType: 'create',
        }
      );
      const response = await confirmEvent(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('refuse un événement avec action reject', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const request = createMockRequest(
        'http://localhost:3000/api/calendar/events/confirm',
        'POST',
        {
          event: { title: 'Réunion refusée' },
          action: 'reject',
          rejectionReason: 'Pas disponible',
        }
      );
      const response = await confirmEvent(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.action).toBe('reject');
    });

    test('supprime un événement avec actionType delete', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const request = createMockRequest(
        'http://localhost:3000/api/calendar/events/confirm',
        'POST',
        {
          event: { title: 'À supprimer' },
          action: 'accept',
          actionType: 'delete',
          eventId: 'event-to-delete',
        }
      );
      const response = await confirmEvent(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('gère la suppression batch', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const request = createMockRequest(
        'http://localhost:3000/api/calendar/events/confirm',
        'POST',
        {
          event: { title: 'Batch delete' },
          action: 'accept',
          actionType: 'batch_delete',
          eventIds: ['event-1', 'event-2', 'event-3'],
        }
      );
      const response = await confirmEvent(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    test('applique les modifications avant création', async () => {
      (getAppSession as jest.Mock).mockResolvedValue({ user: TEST_USER });

      const request = createMockRequest(
        'http://localhost:3000/api/calendar/events/confirm',
        'POST',
        {
          event: {
            title: 'Original',
            startDateTime: '2024-12-21T10:00:00',
            endDateTime: '2024-12-21T11:00:00',
          },
          action: 'accept',
          actionType: 'create',
          modifiedEvent: {
            title: 'Modifié',
            location: 'Salle B',
          },
        }
      );
      const response = await confirmEvent(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});


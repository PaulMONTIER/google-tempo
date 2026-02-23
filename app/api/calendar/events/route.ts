import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/api/session-service";
import { calendarHelpers } from "@/lib/actions/calendar-helpers";
import { handleApiError, ApiError } from "@/lib/api/error-handler";

export async function GET() {
  try {
    const session = await getAppSession();

    if (!session?.user?.id) {
      throw new ApiError(401, "Non authentifié", "UNAUTHORIZED");
    }

    // Récupérer les événements pour les 3 prochains mois
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const events = await calendarHelpers.listEvents(session.user.id, {
      startDate,
      endDate,
    });

    // -------------------------------------------------------------
    // INTEGRATION DU MODE DÉMO (MOCK DATA)
    // -------------------------------------------------------------
    const { prisma } = await import('@/lib/prisma');
    const mockTrees = await prisma.preparationTree.findMany({
      where: { userId: session.user.id, goalTitle: { contains: '(MOCK)' } },
      include: { branches: true }
    });

    // Inject mock events from the database into the calendar view
    const mockEvents: any[] = [];
    mockTrees.forEach(tree => {
      // Goal event
      mockEvents.push({
        id: tree.goalEventId,
        title: tree.goalTitle,
        startDate: tree.goalDate,
        endDate: new Date(tree.goalDate.getTime() + 2 * 60 * 60 * 1000), // + 2 hours
        color: '#f59e0b', // amber for goal
        eventType: 'main'
      });

      // Branch events
      tree.branches.forEach(branch => {
        mockEvents.push({
          id: branch.branchEventId,
          title: branch.branchTitle,
          startDate: branch.branchDate,
          endDate: new Date(branch.branchDate.getTime() + 60 * 60 * 1000), // + 1 hour
          color: '#3b82f6', // blue for branch
          eventType: 'preparation',
          parentEventId: tree.goalEventId
        });
      });
    });

    return NextResponse.json({ events: [...events, ...mockEvents] });
  } catch (error: unknown) {
    return handleApiError(error, "calendar/events");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAppSession();

    if (!session?.user?.id) {
      throw new ApiError(401, "Non authentifié", "UNAUTHORIZED");
    }

    const body = await request.json();
    const { title, description, startDate, endDate } = body;

    if (!title || !startDate || !endDate) {
      throw new ApiError(400, "Champs requis manquants", "BAD_REQUEST");
    }

    const event = await calendarHelpers.createEvent(session.user.id, {
      summary: title,
      description,
      start: {
        dateTime: new Date(startDate).toISOString(),
        timeZone: 'Europe/Paris', // Default timezone, could be dynamic
      },
      end: {
        dateTime: new Date(endDate).toISOString(),
        timeZone: 'Europe/Paris',
      },
    });

    return NextResponse.json({ event });
  } catch (error: unknown) {
    return handleApiError(error, "calendar/events/create");
  }
}


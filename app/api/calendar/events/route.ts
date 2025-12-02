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

    return NextResponse.json({ events });
  } catch (error: unknown) {
    return handleApiError(error, "calendar/events");
  }
}


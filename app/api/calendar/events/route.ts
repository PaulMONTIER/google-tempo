import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/auth-options";
import { calendarHelpers } from "@/lib/actions/calendar-helpers";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Récupérer les événements pour les 3 prochains mois
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const events = await calendarHelpers.listEvents(session.user.id, {
      startDate,
      endDate,
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}


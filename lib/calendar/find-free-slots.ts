import { getCalendarClient } from "./oauth-client";
import { addDays, formatSlotLabel } from "@/lib/utils/date-helpers";
import { generateCandidateSlots, type CandidateSlot } from "./utils/slot-generator";
import { filterFreeSlots } from "./utils/slot-filter";

export interface FindFreeSlotsOptions {
  startDate?: Date;
  endDate?: Date;
  workingHoursStart?: number;
  workingHoursEnd?: number;
  excludeWeekends?: boolean;
  maxSlots?: number;
}

export interface FreeSlot {
  start: string;
  end: string;
  label: string;
}

/**
 * Trouve les créneaux libres dans le calendrier Google de l'utilisateur
 * @param userId - ID de l'utilisateur
 * @param durationMinutes - Durée souhaitée en minutes
 * @param options - Options de recherche (dates, heures de travail, etc.)
 * @returns Liste des créneaux libres disponibles
 */
export async function findFreeCalendarSlots(
  userId: string,
  durationMinutes: number,
  options: FindFreeSlotsOptions = {}
): Promise<FreeSlot[]> {
  const {
    startDate = new Date(),
    endDate = addDays(new Date(), 14),
    workingHoursStart = 9,
    workingHoursEnd = 18,
    excludeWeekends = true,
    maxSlots = 4,
  } = options;

  const calendar = await getCalendarClient(userId);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      items: [{ id: "primary" }],
      timeZone: "Europe/Paris",
    },
  });

  const busySlots = response.data.calendars?.primary?.busy || [];

  // Générer les créneaux candidats
  const candidateSlots = generateCandidateSlots({
    startDate,
    endDate,
    workingHoursStart,
    workingHoursEnd,
    excludeWeekends,
    durationMinutes,
    maxSlots,
  });

  // Filtrer les créneaux libres
  const freeSlots = filterFreeSlots(candidateSlots, busySlots);

  return freeSlots.slice(0, maxSlots).map((slot) => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    label: formatSlotLabel(slot.start),
  }));
}


import { addDays } from "@/lib/utils/date-helpers";

export interface SlotGeneratorOptions {
  startDate: Date;
  endDate: Date;
  workingHoursStart: number;
  workingHoursEnd: number;
  excludeWeekends: boolean;
  durationMinutes: number;
  maxSlots: number;
}

export interface CandidateSlot {
  start: Date;
  end: Date;
}

/**
 * Génère les créneaux candidats selon les options de recherche
 * @param options Options de génération (dates, heures, durée, etc.)
 * @returns Liste des créneaux candidats
 */
export function generateCandidateSlots(options: SlotGeneratorOptions): CandidateSlot[] {
  const {
    startDate,
    endDate,
    workingHoursStart,
    workingHoursEnd,
    excludeWeekends,
    durationMinutes,
    maxSlots,
  } = options;

  const candidateSlots: CandidateSlot[] = [];
  let currentDate = new Date(startDate);

  // Aligner sur les créneaux de 30 minutes
  const minutes = currentDate.getMinutes();
  if (minutes !== 0 && minutes !== 30) {
    const nextSlotMinutes = minutes < 30 ? 30 : 60;
    currentDate.setMinutes(nextSlotMinutes === 60 ? 0 : nextSlotMinutes, 0, 0);
    if (nextSlotMinutes === 60) {
      currentDate.setHours(currentDate.getHours() + 1);
    }
  }

  while (currentDate < endDate && candidateSlots.length < maxSlots * 10) {
    const dayOfWeek = currentDate.getDay();

    // Exclure les weekends si demandé
    if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      currentDate = addDays(currentDate, 1);
      currentDate.setHours(workingHoursStart, 0, 0, 0);
      continue;
    }

    const hour = currentDate.getHours();

    // Vérifier les heures de travail
    if (hour < workingHoursStart || hour >= workingHoursEnd) {
      if (hour >= workingHoursEnd) {
        currentDate = addDays(currentDate, 1);
        currentDate.setHours(workingHoursStart, 0, 0, 0);
      } else {
        currentDate.setHours(workingHoursStart, 0, 0, 0);
      }
      continue;
    }

    // Vérifier que le créneau ne dépasse pas les heures de travail
    const slotEnd = new Date(currentDate.getTime() + durationMinutes * 60 * 1000);
    if (slotEnd.getHours() > workingHoursEnd) {
      currentDate = addDays(currentDate, 1);
      currentDate.setHours(workingHoursStart, 0, 0, 0);
      continue;
    }

    candidateSlots.push({ start: new Date(currentDate), end: slotEnd });
    currentDate = new Date(currentDate.getTime() + 30 * 60 * 1000);
  }

  return candidateSlots;
}


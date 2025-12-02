import type { CandidateSlot } from "./slot-generator";

export interface BusySlot {
  start?: string | null;
  end?: string | null;
}

/**
 * Filtre les créneaux candidats pour ne garder que ceux qui sont libres
 * @param candidateSlots Liste des créneaux candidats
 * @param busySlots Liste des créneaux occupés depuis l'API
 * @returns Liste des créneaux libres
 */
export function filterFreeSlots(
  candidateSlots: CandidateSlot[],
  busySlots: BusySlot[]
): CandidateSlot[] {
  return candidateSlots.filter((slot) => {
    return !busySlots.some((busy) => {
      if (!busy.start || !busy.end) return false;
      
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      
      // Vérifier s'il y a un conflit (chevauchement)
      return slot.start < busyEnd && slot.end > busyStart;
    });
  });
}


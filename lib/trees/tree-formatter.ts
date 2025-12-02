import { CalendarEvent } from '@/types';

export interface TreeGoal {
  id: string;
  name: string;
  date: Date;
  branches: CalendarEvent[];
}

interface TreeData {
  goal: CalendarEvent | null;
  branches: CalendarEvent[];
}

interface APITreeResponse {
  trees: Array<{
    goalId: string;
    goalTitle: string;
    branchIds: string[];
  }>;
}

/**
 * Formate les données d'annotations en TreeGoal[]
 * @param treeMap - Map des annotations parsées
 * @returns Liste des arbres formatés (uniquement ceux avec goal + au moins 1 branche)
 */
export function formatTreeFromAnnotations(
  treeMap: Map<string, TreeData>
): TreeGoal[] {
  const result: TreeGoal[] = [];

  treeMap.forEach((tree) => {
    if (tree.goal && tree.branches.length > 0) {
      // Trier les branches par date
      const sortedBranches = tree.branches.sort((a, b) => {
        const dateA = new Date((a as any).start || a.startDate).getTime();
        const dateB = new Date((b as any).start || b.startDate).getTime();
        return dateA - dateB;
      });

      result.push({
        id: tree.goal.id,
        name: tree.goal.title,
        date: new Date((tree.goal as any).start || tree.goal.startDate),
        branches: sortedBranches,
      });
    }
  });

  return result;
}

/**
 * Formate la réponse API en TreeGoal[]
 * @param apiResponse - Réponse de l'API analyze-trees
 * @param events - Liste complète des événements pour mapper les IDs
 * @returns Liste des arbres formatés
 */
export function formatTreeFromAPI(
  apiResponse: APITreeResponse,
  events: CalendarEvent[]
): TreeGoal[] {
  return apiResponse.trees
    .map((tree) => {
      const goalEvent = events.find(e => e.id === tree.goalId);
      if (!goalEvent) return null;

      const branchEvents = tree.branchIds
        .map((id: string) => events.find(e => e.id === id))
        .filter((e: CalendarEvent | undefined) => e !== undefined)
        .sort((a: CalendarEvent, b: CalendarEvent) => {
          const dateA = new Date((a as any).start || a.startDate).getTime();
          const dateB = new Date((b as any).start || b.startDate).getTime();
          return dateA - dateB;
        });

      return {
        id: goalEvent.id,
        name: tree.goalTitle || goalEvent.title,
        date: new Date((goalEvent as any).start || goalEvent.startDate),
        branches: branchEvents,
      };
    })
    .filter((tree: TreeGoal | null) => tree !== null) as TreeGoal[];
}


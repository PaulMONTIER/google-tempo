import { CalendarEvent } from '@/types';

interface TreeData {
  goal: CalendarEvent | null;
  branches: CalendarEvent[];
}

/**
 * Parse les annotations <!--tree:ID:type--> dans les descriptions d'événements
 * @param events - Liste des événements à analyser
 * @returns Map associant chaque treeId à ses données (goal + branches)
 */
export function parseTreeAnnotations(
  events: CalendarEvent[]
): Map<string, TreeData> {
  const treeMap = new Map<string, TreeData>();

  events.forEach(event => {
    const description = event.description || '';
    const match = description.match(/<!--tree:([^:]+):(goal|branch)-->/);

    if (match) {
      const [, treeId, type] = match;

      if (!treeMap.has(treeId)) {
        treeMap.set(treeId, { goal: null, branches: [] });
      }

      const tree = treeMap.get(treeId)!;

      if (type === 'goal') {
        tree.goal = event;
      } else {
        tree.branches.push(event);
      }
    }
  });

  return treeMap;
}


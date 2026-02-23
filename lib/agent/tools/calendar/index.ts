// Export centralisé de tous les outils calendrier
export { findFreeSlotsTool } from "./find-free-slots";
export { createEventTool } from "./create-event";
export { getEventsTool } from "./get-events";
export { addMeetToEventTool } from "./add-meet";
export { deleteEventTool } from "./delete-event";
export { createPreparationTreeTool } from "./create-preparation-tree";

// Export des outils de recherche personnelle
export { searchPersonalKnowledgeTool } from "../knowledge/search-knowledge";

// Nouveaux outils de proactivité
export { optimizeScheduleTool } from "./optimize-schedule";

// Outils batch pour opérations en masse
export { filterEventsTool } from "./filter-events";
export { batchDeleteTool } from "./batch-delete";

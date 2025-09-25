// Import all controllers first
import { QuestController } from "./quest-controller";
import { ClaimController } from "./claim-controller";
import { UserController } from "./user-controller";
import { TagController } from "./tag-controller";

// Export all controllers for easy importing
export { QuestController } from "./quest-controller";
export { ClaimController } from "./claim-controller";
export { UserController } from "./user-controller";
export { TagController } from "./tag-controller";

// Export types for easier usage
export type { QuestFilters, CreateQuestData } from "./quest-controller";

export type {
	CreateClaimData,
	UpdateClaimStatusData,
} from "./claim-controller";

export type { CreateUserData, UpdateUserXPData } from "./user-controller";

export type { TagSuggestionData } from "./tag-controller";

// Convenience exports for common operations
export class ZKQuestControllers {
	static quest = QuestController;
	static claim = ClaimController;
	static user = UserController;
	static tag = TagController;
}

// Default export for easy access
export default ZKQuestControllers;

import { BaseDatabaseService } from "@/app/lib/database/database.base.ts";

/**
 * Concrete database service. Pure delegation via {@link BaseDatabaseService}.
 */
class DatabaseService extends BaseDatabaseService {}

export { DatabaseService };

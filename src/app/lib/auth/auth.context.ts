import { createAuth } from "@/app/lib/auth/auth.factory.ts";
import type { IAuthService } from "@/app/lib/auth/auth.interface.ts";
import { useDatabase } from "@/app/lib/database/database.context.ts";
import type { IDatabaseService } from "@/app/lib/database/database.interface.ts";
import { useEnv } from "@/app/lib/env/env.context.ts";
import type { IEnvService } from "@/app/lib/env/env.interface.ts";

let _auth: IAuthService | undefined;

/**
 * Lazily-built, process-wide auth credential service.
 *
 * Wires the shared database client and the dedicated lookup pepper from the
 * validated environment.
 *
 * @returns {IAuthService} The auth service.
 */
const useAuth: () => IAuthService = (): IAuthService => {
  if (!_auth) {
    const database: IDatabaseService = useDatabase();
    const env: IEnvService = useEnv();
    _auth = createAuth({
      config: { lookupPepper: env.config.authLookupPepper },
      db: database.db,
    });
  }
  return _auth;
};

export { useAuth };

import { type ApiEndpoint, IdToken } from "@/app/lib/api/api.constants.ts";

const endpointFor: (template: ApiEndpoint, id: number) => string = (
  template: ApiEndpoint,
  id: number,
): string => template.replace(IdToken, String(id));

export { endpointFor };

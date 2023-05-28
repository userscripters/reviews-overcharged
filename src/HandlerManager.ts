import type { SuggestedEdit } from "@userscripters/stackexchange-api-types";

import type { config } from "./config";
import { Manager } from "./Manager";

export type Handler = (
    cnf: typeof config,
    info?: SuggestedEdit
) => boolean | Promise<boolean>;

export class HandlerManager extends Manager<Handler> {}

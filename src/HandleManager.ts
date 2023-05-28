import type { SuggestedEdit } from "@userscripters/stackexchange-api-types";

import type { config } from "./config";

export type Handler = (
    cnf: typeof config,
    info?: SuggestedEdit
) => boolean | Promise<boolean>;

export class HandlerManager {
    constructor(public handlers: Record<string, Handler>) {}

    get names() {
        const { handlers } = this;
        return Object.keys(handlers);
    }

    get actors() {
        const { handlers } = this;
        return Object.values(handlers);
    }

    runAll(cnf: typeof config) {
        const { actors } = this;
        return Promise.all(actors.map((v) => v(cnf)));
    }
}

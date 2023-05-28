import type { config } from "./config";

export type Cleaner = (cnf: typeof config) => boolean | Promise<boolean>;

export class CleanerManager {
    constructor(public handlers: Record<string, Cleaner>) {}

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

import type { config } from "./config";

export abstract class Manager<T extends Function> {
    constructor(public handlers: Record<string, T>) {}

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

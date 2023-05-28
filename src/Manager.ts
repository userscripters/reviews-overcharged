export abstract class Manager<T extends (...args: any[]) => any> {
    constructor(public handlers: Record<string, T>) {}

    get names() {
        const { handlers } = this;
        return Object.keys(handlers);
    }

    get actors() {
        const { handlers } = this;
        return Object.values(handlers);
    }

    runAll(...args: Parameters<T>) {
        const { actors } = this;
        return Promise.all(actors.map((v) => v(...args)));
    }
}

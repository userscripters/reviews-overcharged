import { SuggestedEdit } from "@userscripters/stackexchange-api-types";
import { getSuggestionInfo } from "./api";
import { addAuditNotification } from "./audits";
import { removeExistingSidebars } from "./cleanup";
import { config } from "./config";
import { decolorDiff } from "./diffs";
import { isTagEdit } from "./guards";
// import { testGraph } from "./graphs";
import { moveProgressToTabs } from "./progress";
import { addStatsSidebar } from "./stats";
import { optimizePageTitle } from "./title";

// testGraph();

type Handler = (
    cnf: typeof config,
    info?: SuggestedEdit
) => boolean | Promise<boolean>;

type Cleaner = (cnf: typeof config) => boolean | Promise<boolean>;

window.addEventListener("load", async () => {

    let suggestedEditId: number | undefined;
    $(document).ajaxComplete((_, xhr) => {
        const { responseJSON } = xhr;
        if (typeof responseJSON === "object" && responseJSON) {
            suggestedEditId = responseJSON.suggestedEditId;
        }
    });

    const scriptName = "ReviewOvercharged";

    class HandlerManager {
        constructor(public handlers: Record<string, Handler>) { }

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

    const manager = new HandlerManager({
        moveProgressToTabs,
        optimizePageTitle,
        decolorDiff,
    });

    const isTagItem = await isTagEdit(config);

    const item = isTagItem || !suggestedEditId ? void 0 : await getSuggestionInfo(suggestedEditId);

    console.debug(`[${scriptName}] suggested edit id: ${suggestedEditId}`);

    if (!item && !isTagItem) {
        await manager.runAll(config);
        addAuditNotification(config);
        return;
    }

    //modules + ES5 leads to .name being inaccessible
    Object.assign(manager.handlers, { addStatsSidebar });

    const cleanups: Cleaner[] = [removeExistingSidebars];

    const { names } = manager;

    const statuses = await manager.runAll(config);

    const statusMsg = statuses.reduce(
        (acc, v, i) => `${acc}\n${names[i]} - ${v ? "ok" : "failed"}`,
        `${scriptName} init:`
    );

    console.debug(statusMsg);

    const {
        selectors: {
            actions: { wrapper },
        },
    } = config;

    const nodeTypes = [Node.TEXT_NODE, Node.COMMENT_NODE];

    const obs = new MutationObserver(async (records) => {
        const newTaskRecord = records.find(({ addedNodes }) =>
            [...addedNodes].some(
                (node) =>
                    nodeTypes.every((type) => type !== node.nodeType) &&
                    (node as HTMLElement).matches(wrapper)
            )
        );

        if (!newTaskRecord) return;

        await manager.runAll(config);

        await Promise.all(cleanups.map((handler) => handler(config)));
    });

    obs.observe(document, { subtree: true, childList: true });
});

import { addAuditNotification } from "./audits";
import { removeExistingSidebars } from "./cleanup";
import { config } from "./config";
import { decolorDiff } from "./diffs";
import { getPostId } from "./getters";
import { isTagEdit } from "./guards";
// import { testGraph } from "./graphs";
import { moveProgressToTabs } from "./progress";
import { addStatsSidebar } from "./stats";
import { optimizePageTitle } from "./title";

// testGraph();

type Handler = (
    cnf: typeof config,
    postId?: string
) => boolean | Promise<boolean>;

type Cleaner = (cnf: typeof config) => boolean | Promise<boolean>;

window.addEventListener("load", async () => {
    const scriptName = "ReviewOvercharged";

    const isTagEditItem = await isTagEdit(config);
    if (!isTagEditItem) {
        console.debug(`[${scriptName}] review item is not a tag wiki excerpt edit`);
    }

    const postId = isTagEditItem ? void 0 : await getPostId(config);
    if (!postId) {
        console.debug(`[${scriptName}] review item is not a post edit`);
    }

    if (!isTagEditItem && !postId) {
        console.debug(`[${scriptName}] unknown review item type`);
        return;
    }

    const handlerMap: Record<string, Handler> = {
        moveProgressToTabs,
        optimizePageTitle,
        decolorDiff,
        addStatsSidebar,
    };

    if (!isTagEditItem) {
        Object.assign(handlerMap, { addAuditNotification });
    }

    const handlers: Handler[] = Object.values(handlerMap);

    const cleanups: Cleaner[] = [removeExistingSidebars];

    //modules + ES5 leads to .name being inaccessible
    const names = Object.keys(handlerMap);

    const promises = handlers.map((handler) => handler(config, postId));

    const statuses = await Promise.all(promises);

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

        await Promise.all([
            addStatsSidebar(config),
            moveProgressToTabs(config),
        ]);

        await Promise.all(cleanups.map((handler) => handler(config)));
    });

    obs.observe(document, { subtree: true, childList: true });
});

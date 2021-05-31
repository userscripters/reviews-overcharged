import { addAuditNotification } from "./audits";
import { config } from "./config";
import { decolorDiff } from "./diffs";
import { getPostId } from "./getters";
// import { testGraph } from "./graphs";
import { moveProgressToTabs } from "./progress";
import { addStatsSidebar } from "./stats";
import { optimizePageTitle } from "./title";

// testGraph();

type Handler = (
    cnf: typeof config,
    postId: string
) => boolean | Promise<boolean>;

(async () => {
    const postId = getPostId(config);

    if (!postId) return;

    const handlers: Handler[] = [
        moveProgressToTabs,
        optimizePageTitle,
        decolorDiff,
        addAuditNotification,
        addStatsSidebar,
    ];

    const promises = handlers.map((handler) => [
        handler.name,
        handler(config, postId),
    ]);

    const statuses = await Promise.all(promises);

    const statusMsg = statuses.reduce(
        (acc, [k, v]) => `${acc}\n${k} - ${v ? "ok" : "failed"}`,
        "Status: "
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
    });

    obs.observe(document, { subtree: true, childList: true });
})();

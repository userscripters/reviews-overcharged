import { getSuggestionInfo } from "./api";
import { addAuditNotification } from "./audits";
import { removeExistingSidebars } from "./cleanup";
import { config } from "./config";
import { decolorDiff } from "./diffs";
import { isTagEdit } from "./guards";
import { CleanerManager } from "./CleanerManager";
import { HandlerManager } from "./HandlerManager";
import { moveProgressToTabs } from "./progress";
import { reportHandlersStatus } from "./reports";
import { addMyStatsSidebar, addStatsSidebar } from "./stats";
import { optimizePageTitle } from "./title";

window.addEventListener("load", async () => {
    let isAudit = false;
    let suggestedEditId: number | undefined;
    $(document).ajaxComplete((_, xhr) => {
        const { responseJSON } = xhr;
        if (typeof responseJSON === "object" && responseJSON) {
            suggestedEditId = responseJSON.suggestedEditId;
            isAudit = responseJSON.isAudit;
        }
    });

    const scriptName = "ReviewOvercharged";

    const cleaner = new CleanerManager({
        removeExistingSidebars,
    });

    const manager = new HandlerManager({
        moveProgressToTabs,
        optimizePageTitle,
        decolorDiff,
    });

    const isTagItem = await isTagEdit(config);

    const item =
        isTagItem || !suggestedEditId
            ? void 0
            : await getSuggestionInfo(suggestedEditId);

    console.debug(`[${scriptName}] suggested edit id: ${suggestedEditId}`);

    if (!item && !isTagItem) {
        const statuses = await manager.runAll(config);
        reportHandlersStatus(scriptName, manager.names, statuses);
        if (isAudit) addAuditNotification(config);
        return;
    }

    //modules + ES5 leads to .name being inaccessible
    Object.assign(manager.handlers, { addStatsSidebar });

    const statuses = await manager.runAll(config);

    reportHandlersStatus(scriptName, manager.names, statuses);

    await addMyStatsSidebar(config);

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

        const statuses = await manager.runAll(config);
        reportHandlersStatus(scriptName, manager.names, statuses);
        if (isAudit) addAuditNotification(config);

        await cleaner.runAll(config);
    });

    obs.observe(document, { subtree: true, childList: true });
});

import { SuggestedEdit, User } from "@userscripters/stackexchange-api-types";
import { getSuggestionsUserStats } from "./api";
import { config } from "./config";
import { createItem } from "./dom";
import { waitForSelector } from "./domUtils";
import { getEditAuthorId, getSuggestionTotals } from "./getters";
import { GraphSerie, LineGraph, PointConfig, SerieConfig } from "./graphs";
import { getRejectionCount, RejectionCount } from "./rejections";
import { a, br, ListOptions, p, text, ul } from "./templaters";
import { getUserInfo } from "./users";
import { delay, getReviewId, normalizeDatasetPropName, pluralize, safeMatch, scase, toPercent } from "./utils";

export type ReviewerDailyStat = {
    "approve": number,
    "edit": number,
    "reject": number,
    "reject and edit": number,
    "skip": number,
};

export type ReviewerDailyStats = Map<string, ReviewerDailyStat>;

export type ReviewAction = "approve" | "edit" | "reject" | "reject and edit" | "skip";

export const createEditAuthorItem = ({
    display_name,
    reputation,
    link,
}: User) => {
    const namePar = p(`Name: `);
    namePar.append(a(link, display_name));

    return createItem(
        ul({
            header: "Edit Author",
            items: [namePar, `Reputation: ${reputation}`],
        })
    );
};

export const createEditorStatsItem = (
    { link }: User,
    suggestions: SuggestedEdit[]
) => {
    const {
        approved,
        pending,
        rejected,
        total,
        ratio: { approvedToRejected, ofApproved, ofPending, ofRejected },
    } = getSuggestionTotals(suggestions);

    const itemParams: ListOptions = {
        header: "Author Stats",
        items: [],
    };

    if (!total) {
        const infoPar = p(`Tag wiki/excerpt edits are not returned.`);

        infoPar.append(
            br(),
            text(`See their `),
            a(`${link}?tab=activity&sort=suggestions`, "activity tab")
        );

        itemParams.items.push(infoPar);
        return createItem(ul(itemParams));
    }

    itemParams.items.push(
        `Approved: ${approved} (${toPercent(ofApproved, 2)})`,
        `Rejected: ${rejected} (${toPercent(ofRejected, 2)})`,
        `Pending: ${pending} (${toPercent(ofPending, 2)})`,
        `Of total: ${total}`,
        `Ratio: ${approvedToRejected.toFixed(1)}`
    );

    return createItem(ul(itemParams));
};

export const createRejectionCountItem = (count: RejectionCount) => {
    const withVotes = Object.entries(count).filter(([_k, v]) => !!v);
    const items = withVotes.map(([k, v]) => `${scase(k)}: ${v}`);

    if (!items.length) items.push("No reject votes");

    return createItem(ul({ items, header: "Reject votes" }));
};

export const addStatsSidebar = async (cnf: typeof config) => {
    const sidebar = document.querySelector(cnf.selectors.actions.sidebar);

    if (!sidebar) return false;

    const dialog = document.createElement("div");
    dialog.classList.add(
        "s-sidebarwidget",
        "ps-sticky",
        "t64",
        "ml24",
        "mt24",
        "ws3"
    );
    dialog.id = `${cnf.ids.sidebar.extra}-${getReviewId()}`;

    const header = document.createElement("div");
    header.classList.add("s-sidebarwidget--header");
    header.textContent = "Extra Info";

    const itemWrap = document.createElement("div");
    itemWrap.classList.add(cnf.classes.grid.container, "fd-column");

    const authorId = getEditAuthorId();

    const rejectCount = await getRejectionCount(cnf);
    if (!rejectCount) return false;

    const items: HTMLDivElement[] = [];

    if (authorId) {
        const [editAuthorInfo, editAuthorStats] = await Promise.all([
            getUserInfo(cnf, authorId),
            getSuggestionsUserStats(cnf, authorId),
        ]);

        editAuthorInfo &&
            items.push(
                createEditAuthorItem(editAuthorInfo),
                createEditorStatsItem(editAuthorInfo, editAuthorStats)
            );
    }

    items.push(createRejectionCountItem(rejectCount));

    itemWrap.append(...items);
    dialog.append(header, itemWrap);
    sidebar.append(dialog);
    return true;
};

const allReviewActions: ReviewAction[] = ["approve", "edit", "reject", "reject and edit", "skip"];

/**
 * @summary type guard for checking if an action string is {@link ReviewAction}
 * @param maybeAction potential action string
 */
const isReviewAction = (maybeAction: string): maybeAction is ReviewAction => {
    return allReviewActions.some((a) => a === maybeAction);
};

/**
 * @summary gets reviewer daily stats
 * @param scriptName name of the script (for debugging)
 * @param userId id of the current user
 * @param options configuration options
 */
export const getDailyReviewerStats = async (
    scriptName: string,
    userId: number,
    options: { pageNum?: number; maxPage?: number; } = {}
): Promise<ReviewerDailyStats> => {
    const { pageNum = 1, maxPage = 10 } = options;

    const stats: ReviewerDailyStats = new Map();

    if (pageNum >= maxPage) {
        console.debug(`[${scriptName}] reached max page (${maxPage}) for daily stats`);
        return stats;
    }

    const url = new URL(`${location.origin}/review/suggested-edits/history`);
    const { searchParams } = url;
    searchParams.set("userid", userId.toString());
    searchParams.set("skipped", "true");
    searchParams.set("page", pageNum.toString());

    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
        console.debug(`[${scriptName}] failed to get: ${url}`);
        return stats;
    }

    const page = $(await res.text());

    const rows = page.find<HTMLTableRowElement>("#content table > tbody > tr");
    if (!rows.length) {
        return stats;
    }

    rows.each((_, row) => {
        const { cells } = row;

        const [userCell, _infoCell, actionCell, dateCell] = cells;

        const action = actionCell.textContent?.trim().toLowerCase();
        const date = dateCell.querySelector("span")?.title.slice(0, 10);
        const uid = Number(userCell.querySelector("a")?.href.replace(/.*?users\/(\d+)\/.*/, "$1"));

        if (!action || !date || !uid) {
            console.debug(`[${scriptName}] malformed review row: ${date} ${action} ${uid}`);
            return;
        }

        if (!isReviewAction(action)) {
            console.debug(`[${scriptName}] not a review action: ${action}`);
            return;
        }

        // 10K+ users will see others in the table
        if (uid !== userId) {
            console.debug(`[${scriptName}] skipping non-matching uid: ${uid}`);
            return;
        }

        if (!stats.has(date)) {
            stats.set(date, {
                "approve": 0,
                "edit": 0,
                "reject": 0,
                "reject and edit": 0,
                "skip": 0
            });
        }

        const stat = stats.get(date);
        if (!stat) {
            console.debug(`[${scriptName}] missing daily stat for ${date}`);
            return;
        }

        stat[action] += 1;
    });

    await delay(2e3 + 10);

    const moreStats = await getDailyReviewerStats(scriptName, userId, {
        ...options,
        pageNum: pageNum + 1,
    });

    moreStats.forEach((stat, date) => {
        const existingStat = stats.get(date);
        if (existingStat) {
            existingStat.approve += stat.approve;
            existingStat.reject += stat.reject;
            existingStat.skip += stat.skip;
            return;
        }

        stats.set(date, stat);
    });

    return stats;
};

/**
 * @summary updates "my stats" graph when the user submits a review
 * @param graph {@link LineGraph} with stats
 * @param serie {@link GraphSerie} to update
 * @param commonPointConfig {@link PointConfig} shared by all points
 */
const updateMyStatsGraphOnReviewSubmit = (
    graph: LineGraph,
    serie: GraphSerie,
    commonPointConfig: Omit<PointConfig, "x" | "y">
) => {
    const nowUTC = new Date().toISOString().slice(0, 10);

    if (!graph.hasXaxisLabel(nowUTC)) {
        graph.addXaxisLabel(nowUTC);
    }

    const pointId = `${serie.id}-${nowUTC}`;

    const point = serie.pointById(pointId);
    if (point) {
        const skip = point.y + 1;
        point.y = skip;
        point.tooltip = pluralize(skip, "skip") + ` on ${nowUTC}`;
        graph.draw();
        return;
    }

    serie.pushPoints({
        ...commonPointConfig,
        y: 1,
        id: pointId,
        tooltip: pluralize(1, "skip") + ` on ${nowUTC}`,
    });

    if (graph.maxNumPoints > 10) graph.shift();

    graph.draw();
}

/**
 * @summary adds a sidebar with reviewer own stats
 * @param cnf script configuration
 */
export const addMyStatsSidebar = async (cnf: typeof config) => {
    const sidebar = document.querySelector(config.selectors.actions.sidebar);
    if (!sidebar) return false;

    const myStatsWrap = document.createElement("div");
    myStatsWrap.classList.add("s-sidebarwidget", "ps-sticky", "t64", "ml24", "mt24", "ws3");
    myStatsWrap.id = `${cnf.script.name}-my-stats`;

    const myStatsHeader = document.createElement("div");
    myStatsHeader.classList.add("s-sidebarwidget--header");
    myStatsHeader.textContent = "My Stats";

    const myStatsGrid = document.createElement("div");
    myStatsGrid.classList.add("grid", "fd-column");

    const myStatsGridCell = document.createElement("div");
    myStatsGridCell.classList.add("grid--cell", "p12");

    myStatsGrid.append(myStatsGridCell);
    myStatsWrap.append(myStatsHeader, myStatsGrid);

    const gridSizePx = 20;
    const graphWidthPx = 290;
    const graphHeightPx = 160;

    const graph = new LineGraph({
        id: "reviewer-daily-stats",
        height: graphHeightPx + gridSizePx,
        width: graphWidthPx,
        gridColour: "var(--black-600)",
        gridSize: gridSizePx,
        xAxisGridLines: false,
        xAxisLabelRotation: 30,
        xAxisLabelSize: 8,
        xAxisLabelColour: "var(--black-400)",
    });

    myStatsGridCell.append(graph.draw().element);
    sidebar.append(myStatsWrap);

    // SE review queues rip the whole sidebar out on every submit
    const mo = new MutationObserver((records) => {
        records.map(async ({ removedNodes }) => {
            if ([...removedNodes].includes(myStatsWrap)) {
                const [newSidebar] = await waitForSelector(
                    `[id^=${cnf.ids.sidebar.extra}]`
                );

                newSidebar.after(myStatsWrap);
            }
        });
    });

    mo.observe(document, {
        childList: true,
        subtree: true,
    });

    const commonSerieConfig: SerieConfig = {
        curved: true
    };

    const approveSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--green-500)",
        id: "approve",
    };

    const editSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--gold)",
        id: "edit",
    };

    const rejectSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--red-500)",
        id: "reject",
    };

    const rejectEditSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--orange-500)",
        id: "reject-edit",
    };

    const skipSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--blue-600)",
        id: "skip",
    };

    const [approveSerie, editSerie, rejectSerie, rejectEditSerie, skipSerie] = graph.pushSeries(
        approveSerieConfig,
        editSerieConfig,
        rejectSerieConfig,
        rejectEditSerieConfig,
        skipSerieConfig
    );

    const userId = StackExchange.options.user.userId;
    if (userId) {
        const stats = await getDailyReviewerStats(cnf.script.name, userId);

        const ascSortedStats = [...stats].sort(([adate], [bdate]) => adate < bdate ? -1 : 1);

        const commonPointConfig: Omit<PointConfig, "x" | "y"> = {
            size: 5,
            type: "circle",
        };

        let maxYpos = graphHeightPx;

        ascSortedStats.forEach(([date, stat]) => {
            graph.addXaxisLabel(date);

            const { approve, edit, reject, skip, "reject and edit": rejectEdit } = stat;

            maxYpos = Math.max(
                maxYpos,
                approve,
                edit,
                reject,
                skip,
                rejectEdit
            );

            const dateSuffix = ` on ${date}`;

            approveSerie.pushPoints({
                ...commonPointConfig,
                y: approve,
                id: `${approveSerie.id}-${date}`,
                tooltip: pluralize(approve, "approval") + dateSuffix,
            });

            editSerie.pushPoints({
                ...commonPointConfig,
                y: edit,
                id: `${editSerie.id}-${date}`,
                tooltip: pluralize(edit, "improvement") + dateSuffix,
            });

            rejectSerie.pushPoints({
                ...commonPointConfig,
                y: reject,
                id: `${rejectSerie.id}-${date}`,
                tooltip: pluralize(reject, "rejection") + dateSuffix,
            });

            rejectEditSerie.pushPoints({
                ...commonPointConfig,
                y: rejectEdit,
                id: `${rejectEditSerie.id}-${date}`,
                tooltip: pluralize(rejectEdit, "reject & edit") + dateSuffix,
            });

            skipSerie.pushPoints({
                ...commonPointConfig,
                y: skip,
                id: `${skipSerie.id}-${date}`,
                tooltip: pluralize(skip, "skip") + dateSuffix,
            });
        });

        graph.height = maxYpos + gridSizePx;
        graph.draw();

        const normalizedReadyPropName = normalizeDatasetPropName(
            `${cnf.script.name}-graph-skip-serie`
        );

        const obs = new MutationObserver(() => {
            const skipBtn = document.querySelector<HTMLButtonElement>(cnf.selectors.buttons.skip);
            const isReady = skipBtn?.dataset[normalizedReadyPropName] === "ready";
            if (skipBtn && !isReady) {
                skipBtn.dataset[normalizedReadyPropName] = "ready";

                skipBtn.addEventListener("click", () => {
                    updateMyStatsGraphOnReviewSubmit(graph, skipSerie, commonPointConfig);
                });
            }
        });

        obs.observe(document, {
            childList: true,
            subtree: true,
        });

        const voteTypeSerieMap = new Map<string, GraphSerie>();
        voteTypeSerieMap.set("3", rejectSerie);

        $(document).ajaxComplete((_, __, { url = "" }) => {
            const [voteType] = safeMatch(url, /\/suggested-edit\/\d+\/vote\/(\d+)/);
            const serie = voteTypeSerieMap.get(voteType);
            if (serie) {
                updateMyStatsGraphOnReviewSubmit(graph, serie, commonPointConfig);
            }
        });
    }

    return true;
};
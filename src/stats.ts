import { SuggestedEdit, User } from "@userscripters/stackexchange-api-types";
import { getSuggestionsUserStats } from "./api";
import { config } from "./config";
import { createItem } from "./dom";
import { getEditAuthorId, getSuggestionTotals } from "./getters";
import { LineGraph, PointConfig, SerieConfig } from "./graphs";
import { getRejectionCount, RejectionCount } from "./rejections";
import { a, br, ListOptions, p, text, ul } from "./templaters";
import { getUserInfo } from "./users";
import { delay, getReviewId, scase, toPercent } from "./utils";

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
 * @summary adds a sidebar with reviewer own stats
 * @param cnf script configuration
 */
export const addMyStatsSidebar = async (cnf: typeof config) => {
    const sidebar = document.querySelector(config.selectors.actions.sidebar);
    if (!sidebar) return false;

    const myStatsWrap = document.createElement("div");
    myStatsWrap.classList.add("s-sidebarwidget", "ps-sticky", "t64", "ml24", "mt24", "ws3");
    myStatsWrap.id = `${config.ids.sidebar.extra}-my-stats`;

    const myStatsHeader = document.createElement("div");
    myStatsHeader.classList.add("s-sidebarwidget--header");
    myStatsHeader.textContent = "My Stats";

    const myStatsGrid = document.createElement("div");
    myStatsGrid.classList.add("grid", "fd-column");

    const myStatsGridCell = document.createElement("div");
    myStatsGridCell.classList.add("grid--cell", "p12");

    myStatsGrid.append(myStatsGridCell);
    myStatsWrap.append(myStatsHeader, myStatsGrid);

    const graphWidthPx = 1024;

    const graph = new LineGraph({
        id: "reviewer-daily-stats",
        height: 80,
        width: 290,
        gridColour: "var(--black-600)",
        gridSize: 10,
        xAxisGridLines: false
    });


    myStatsGridCell.append(graph.draw());
    sidebar.append(myStatsWrap);

    const commonSerieConfig: SerieConfig = {
        curved: true
    };

    const approveSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--green-500)"
    };

    const editSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--gold)"
    };

    const rejectSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--red-500)"
    };

    const rejectEditSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--orange-500)"
    };

    const skipSerieConfig: SerieConfig = {
        ...commonSerieConfig,
        colour: "var(--blue-600)"
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

        const commonPointConfig: Omit<PointConfig, "x" | "y"> = {
            size: 5,
            type: "circle",
        };

        const pointPixelShiftMod = Math.floor(graphWidthPx / stats.size);

        const yStep = 10;

        stats.forEach((stat) => {
            const { approve, edit, reject, skip, "reject and edit": rejectEdit } = stat;

            approveSerie.pushPoints({
                ...commonPointConfig,
                x: approveSerie.numPoints * pointPixelShiftMod,
                y: approve * yStep,
            });

            editSerie.pushPoints({
                ...commonPointConfig,
                x: editSerie.numPoints * pointPixelShiftMod,
                y: edit * yStep,
            });

            rejectSerie.pushPoints({
                ...commonPointConfig,
                x: rejectSerie.numPoints * pointPixelShiftMod,
                y: reject * yStep,
            });

            rejectEditSerie.pushPoints({
                ...commonPointConfig,
                x: rejectEditSerie.numPoints * pointPixelShiftMod,
                y: rejectEdit * yStep,
            });

            skipSerie.pushPoints({
                ...commonPointConfig,
                x: skipSerie.numPoints * pointPixelShiftMod,
                y: skip * yStep
            });
        });

        graph.draw();
    }

    return true;
};
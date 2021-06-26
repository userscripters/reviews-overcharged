import { getSuggestionsUserStats } from "./api";
import { config } from "./config";
import { createItem } from "./dom";
import {
    getEditAuthorId,
    getSuggestionTotals,
    SuggestedEditInfo,
} from "./getters";
import { getRejectionCount, RejectionCount } from "./rejections";
import { a, br, ListOptions, p, text, ul } from "./templaters";
import { getUserInfo, UserInfo } from "./users";
import { scase, toPercent } from "./utils";

export const createEditAuthorItem = ({
    display_name,
    reputation,
    link,
}: UserInfo) => {
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
    { link }: UserInfo,
    suggestions: SuggestedEditInfo[]
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
        `Approved: ${approved} (${toPercent(ofApproved)})`,
        `Rejected: ${rejected} (${toPercent(ofRejected)})`,
        `Pending: ${pending} (${toPercent(ofPending)})`,
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
    dialog.classList.add("s-sidebarwidget", "ml24", "mt24");

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

import { getSuggestionsUserStats } from "./api";
import { addAuditNotification } from "./audits";
import { config } from "./config";
import { decolorDiff } from "./diffs";
import { createGridCell, createItem } from "./dom";
import { arraySelect } from "./domUtils";
import {
    getEditAuthorId,
    getPostId,
    getSuggestionTotals,
    SuggestedEditInfo,
} from "./getters";
import { testGraph } from "./graphs";
import { moveProgressToTabs } from "./progress";
import { a, br, ListOptions, p, text, ul } from "./templaters";
import { getUserInfo, UserInfo } from "./users";
import { handleMatchFailure, scase, toPercent } from "./utils";

testGraph(); //TODO: remove
/* type ReputationInfo = {
  on_date: number;
  post_id: number;
  post_type: "answer" | "question";
  reputation_change: number;
  user_id: number;
  vote_type: "up_votes";
}; */

(async () => {
    const createEditAuthorItem = ({
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

    // const getSuggestedEditsInfo = async (...ids: string[]) => {
    //   const url = new URL(
    //     `${API_BASE}/${API_VER}/suggested-edits/${ids.join(",")}`
    //   );

    //   const res = await fetch(url.toString());

    //   if (!res.ok) return [];

    //   const {
    //     items,
    //   } = (await res.json()) as StackAPIBatchResponse<SuggestedEditInfo>;

    //   return items;
    // };

    const createEditorStatsItem = (
        { link }: UserInfo,
        suggestions: SuggestedEditInfo[]
    ) => {
        const {
            approved,
            rejected,
            total,
            ratio: { approvedToRejected, ofApproved, ofRejected },
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
                a(`${link}?tab=activity`, "activity tab")
            );

            itemParams.items.push(infoPar);
            return createItem(ul(itemParams));
        }

        itemParams.items.push(
            `Approved: ${approved} (${toPercent(ofApproved)})`,
            `Rejected: ${rejected} (${toPercent(ofRejected)})`,
            `Of total: ${total}`,
            `Ratio: ${approvedToRejected}`
        );

        return createItem(ul(itemParams));
    };

    const removeTitleLines = (cnf: typeof config, wrapper?: Element) =>
        (wrapper || document)
            .querySelectorAll(cnf.selectors.title.description)
            .forEach((elem) => elem.remove());

    const optimizePageTitle = (cnf: typeof config) => {
        const titleSelector = cnf.selectors.title.title;

        const titleWrap = document.querySelector(titleSelector);
        if (!titleWrap) return handleMatchFailure(titleSelector, false);

        titleWrap.classList.add(cnf.classes.grid.container);

        const header = document.querySelector(cnf.selectors.title.header);

        const titleCell = createGridCell();
        titleCell.classList.add("ml12");
        if (header) titleCell.append(header);

        const learnMoreBtn = titleWrap.querySelector(
            cnf.selectors.title.learnMore
        );

        const linkCell = titleCell.cloneNode() as HTMLDivElement;
        if (learnMoreBtn) linkCell.append(learnMoreBtn);

        removeTitleLines(cnf, titleWrap);

        titleWrap.append(titleCell, linkCell);
        return true;
    };

    type RejectionCount = {
        spam: number;
        improvement: number;
        intent: number;
        reply: number;
        harm: number;
    };

    const callRejectionModal = (cnf: typeof config) => {
        const {
            selectors: {
                buttons,
                actions: { inputs, modal },
            },
        } = cnf;

        const rejectInput = document.querySelector<HTMLInputElement>(
            inputs.reject
        );
        const submitButton = document.querySelector<HTMLButtonElement>(
            buttons.submit
        );
        if (!rejectInput || !submitButton) return null;

        rejectInput.click();
        submitButton.click();

        const modalWrapper = document.querySelector<HTMLFormElement>(
            modal.form
        );
        if (!modalWrapper) return null;

        const dolly = modalWrapper.cloneNode(true) as HTMLDivElement;

        const closeBtn = modalWrapper.querySelector<HTMLButtonElement>(
            buttons.close
        )!;

        closeBtn.click();
        return dolly;
    };

    const getRejectionCount = (cnf: typeof config) => {
        const {
            selectors: {
                actions: { modal },
            },
        } = cnf;

        const modalWrapper = callRejectionModal(cnf);
        if (!modalWrapper) return handleMatchFailure(modal.form, null);

        const withVotes = arraySelect<HTMLLabelElement>(
            modalWrapper,
            modal.votes.labels
        );

        const count: RejectionCount = {
            spam: 0,
            improvement: 0,
            intent: 0,
            reply: 0,
            harm: 0,
        };

        const reasonMap: { [P in keyof RejectionCount as string]: P } = {
            102: "improvement",
            101: "spam",
            104: "intent",
            105: "reply",
            0: "harm",
        };

        const voteSelector = modal.votes.counts;

        withVotes.forEach((label) => {
            const { htmlFor } = label;
            const [_full, reasonId] = htmlFor.match(/(\d+$)/) || [];
            const reason = reasonMap[reasonId];
            if (label.querySelector(voteSelector)) count[reason] += 1;
        });

        return count;
    };

    const createRejectionCountItem = (count: RejectionCount) => {
        const withVotes = Object.entries(count).filter(([_k, v]) => !!v);
        const items = withVotes.map(([k, v]) => `${scase(k)}: ${v}`);

        if (!items.length) items.push("No reject votes");

        return createItem(ul({ items, header: "Reject votes" }));
    };

    const addStatsSidebar = async (cnf: typeof config) => {
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

        if (!authorId) return false;

        const [editAuthorInfo, editAuthorStats] = await Promise.all([
            getUserInfo(authorId),
            getSuggestionsUserStats(authorId),
        ]);

        const rejectCount = getRejectionCount(cnf);

        if (!editAuthorInfo || !rejectCount) return false;

        const items: HTMLDivElement[] = [];

        items.push(
            createEditAuthorItem(editAuthorInfo),
            createEditorStatsItem(editAuthorInfo, editAuthorStats),
            createRejectionCountItem(rejectCount)
        );

        itemWrap.append(...items);

        dialog.append(header, itemWrap);

        editAuthorInfo && sidebar.append(dialog);

        return true;
    };

    const postId = getPostId(config);

    if (!postId) return;

    const handlerMap: {
        [x: string]: (
            cnf: typeof config,
            postId: string
        ) => boolean | Promise<boolean>;
    } = {
        moveProgressToTabs,
        optimizePageTitle,
        decolorDiff,
        addAuditNotification,
    };

    const promises = Object.entries(handlerMap).map(([key, handler]) => [
        key,
        handler(config, postId),
    ]);

    const statuses = await Promise.all(promises);

    const statusMsg = statuses.reduce(
        (acc, [k, v]) => `${acc}\n${k} - ${v ? "ok" : "failed"}`,
        "Status: "
    );

    console.debug(statusMsg);

    await addStatsSidebar(config);
})();

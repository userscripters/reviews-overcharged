import { config } from "./config";
import { arraySelect, waitForSelector } from "./domUtils";
import { handleMatchFailure, safeMatch } from "./utils";

export type SuggestedEditInfo = {
    approval_date?: number;
    comment: string;
    creation_date: number;
    post_id: number;
    post_type: "question" | "answer" | "article";
    proposing_user?: {}; //TODO: expand
    rejection_date?: string;
    suggested_edit_id: number;
    tags: string[];
    title: string;
};

export const getAnswerId = (selector: string) => {
    const link = document.querySelector<HTMLAnchorElement>(selector);
    return safeMatch(
        link?.href || "",
        /\/questions\/\d+\/[\w-]+\/(\d+)/,
        ""
    )[0];
};

export const getQuestionId = (selector: string) => {
    const link = document.querySelector<HTMLAnchorElement>(selector);
    return safeMatch(link?.href || "", /\/questions\/(\d+)/, "")[0];
};

export const getExcerptName = (selector: string) => {
    const link = document.querySelector<HTMLAnchorElement>(selector);
    return safeMatch(link?.href || "", /\/tags\/(.+)\/info/)[0];
};

export const getPostId = ({
    selectors: {
        page: { links },
    },
}: typeof config) => getAnswerId(links.answer) || getQuestionId(links.question);

export const getEditAuthorId = () => {
    const postWrapSelector = config.selectors.info.post.wrapper;

    const spans = document.querySelectorAll(postWrapSelector);
    if (!spans.length) return handleMatchFailure(postWrapSelector, null);

    const userSpan = Array.from(spans).find(({ textContent }) =>
        /proposed/i.test(textContent || "")
    );
    if (!userSpan) return null;

    const cardSelector = config.selectors.info.editor.card;

    const { parentElement } = userSpan;
    const link = parentElement!.querySelector<HTMLAnchorElement>(cardSelector);
    if (!link) return handleMatchFailure(cardSelector, null);

    const { href } = link;
    const [, userId] = href.match(/users\/(\d+)/) || [];
    if (!userId) return null;

    return userId;
};

export const getSuggestionTotals = (suggestions: SuggestedEditInfo[]) => {
    const stats = {
        get ratio() {
            const { approved, rejected, total } = this;
            return {
                ofApproved: approved / total,
                ofRejected: rejected / total,
                approvedToRejected: approved / (rejected === 0 ? 1 : rejected),
            };
        },
        approved: 0,
        rejected: 0,
        total: 0,
    };

    suggestions.forEach(({ approval_date, rejection_date }) => {
        stats.total += 1;
        if (approval_date) stats.approved += 1;
        if (rejection_date) stats.rejected += 1;
    });

    return stats;
};

export type RejectionCount = {
    spam: number;
    improvement: number;
    intent: number;
    reply: number;
    harm: number;
};

const callRejectionModal = async (cnf: typeof config) => {
    const {
        selectors: {
            buttons,
            actions: { inputs, modal, action, disabled },
        },
    } = cnf;

    const rejectInput = document.querySelector<HTMLInputElement>(inputs.reject);
    const submitButton = document.querySelector<HTMLButtonElement>(
        buttons.submit
    );

    if (!rejectInput || !submitButton) return null;

    await waitForSelector(`${action}:not(${disabled})`);

    rejectInput.click();
    submitButton.click();

    const [modalWrapper] = [
        ...(await waitForSelector<HTMLFormElement>(modal.form)),
    ];

    if (!modalWrapper) return handleMatchFailure(modal.form, null);

    const dolly = modalWrapper.cloneNode(true) as HTMLDivElement;

    const closeBtn = modalWrapper.querySelector<HTMLButtonElement>(
        buttons.close
    )!;

    closeBtn.click();
    return dolly;
};

export const getRejectionCount = async (cnf: typeof config) => {
    const {
        selectors: {
            actions: { modal },
        },
    } = cnf;

    const modalWrapper = await callRejectionModal(cnf);
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

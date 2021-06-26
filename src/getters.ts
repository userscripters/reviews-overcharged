import { config } from "./config";
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

type EditorStats = {
    ratio: {
        ofApproved: number;
        ofRejected: number;
        ofPending: number;
        approvedToRejected: number;
    };
    pending: number;
    approved: number;
    rejected: number;
    total: number;
};

export const getSuggestionTotals = (suggestions: SuggestedEditInfo[]) => {
    const stats: EditorStats = {
        get ratio() {
            const { approved, pending, rejected, total } = this;
            return {
                ofApproved: approved / total,
                ofRejected: rejected / total,
                ofPending: pending / total,
                approvedToRejected: approved / (rejected === 0 ? 1 : rejected),
            };
        },
        get pending() {
            const { approved, rejected, total } = this;
            return total - (approved + rejected);
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

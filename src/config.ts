import { last } from "./utils";

export const API_BASE = "https://api.stackexchange.com";

export const DEF_SITE = "stackoverflow";

export const API_VER = 2.2;

export const API_KEY = "7LRwV6M6y9lsj4OFtBej3A((";

export const config = {
    script: {
        name: "Review Overcharged"
    },
    page: {
        suggestionId: last(location.pathname.split("/")),
    },
    classes: {
        grid: {
            container: "grid",
            cell: "grid--cell",
        },
        visibility: {
            none: "v-hidden",
        },
    },
    ids: {
        progress: {
            span: "progress-ratio",
        },
        sidebar: {
            extra: "extra-info",
        },
    },
    filters: {
        unsafe: ")7tZ5Od",
    },
    selectors: {
        actions: {
            action: ".js-action-radio-parent",
            disabled: ".is-disabled",
            wrapper: ".js-review-actions",
            sidebar: ".js-actions-sidebar",
            modal: {
                form: "form[action='/suggested-edits/reject']",
                votes: {
                    labels: "label[for^=rejection-reason].s-label",
                    counts: ".s-badge__votes",
                },
            },
            inputs: {
                reject: "#review-action-Reject",
            },
        },
        buttons: {
            submit: ".js-review-submit",
            skip: ".js-review-actions:not(.d-none) .js-action-button[value='1']",
            close: ".s-modal--close",
        },
        reviews: {
            done: ".js-reviews-done",
            daily: ".js-reviews-per-day",
        },
        diffs: {
            deleted: ".full-diff .deleted > div",
            added: ".full-diff .inserted > div",
        },
        page: {
            links: {
                excerpt: "a.question-hyperlink[href*='/tags']",
                question: "a[href*='/questions/']",
                answer: "a.answer-hyperlink",
            },
        },
        content: {
            typeHint: ".js-review-content .fs-title",
            postSummary: ".s-post-summary",
        },
        title: {
            description: ".s-page-title--description",
            actions: ".s-page-title--actions a",
            learnMore: ".js-show-modal-from-nav.s-link",
            title: ".s-page-title--text",
            header: ".s-page-title--header",
        },
        info: {
            post: {
                wrapper: ".postcell span",
            },
            editor: {
                card: "a.s-user-card--link",
            },
        },
    },
};

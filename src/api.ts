import { API_BASE, API_VER, config, DEF_SITE } from "./config";
import { SuggestedEditInfo } from "./getters";
import { toApiDate } from "./utils";

export type StackAPIBatchResponse<T> = {
    has_more: boolean;
    items: T[];
    quota_max: number;
    quota_remaining: number;
};

export type CommonOptions = {
    site?: string;
};

export type SuggestedEditStatus = "approved" | "rejected" | "all" | "pending";

type SuggestedEditsByPostOptions = {
    type: SuggestedEditStatus;
} & CommonOptions;

type GetSuggestedEditsStatsOptions = {
    from?: Date;
    to?: Date;
    site?: string;
};

type SuggestedEditsFilters = {
    [P in SuggestedEditStatus]?: (val: SuggestedEditInfo) => boolean;
};

export const getSuggestionsByPost = async (
    postId: string,
    { site = DEF_SITE, type = "all" }: SuggestedEditsByPostOptions
) => {
    const url = new URL(
        `${API_BASE}/${API_VER}/posts/${postId}/suggested-edits`
    );

    url.search = new URLSearchParams({ site }).toString();

    const res = await fetch(url.toString());

    if (!res.ok) return [];

    const { items } = <StackAPIBatchResponse<SuggestedEditInfo>>(
        await res.json()
    );

    const filters: SuggestedEditsFilters = {
        approved: ({ approval_date }) => !!approval_date,
        rejected: ({ rejection_date }) => !!rejection_date,
        pending: ({ approval_date, rejection_date }) =>
            !approval_date && !rejection_date,
    };

    const predicate = filters[type];

    return predicate ? items.filter(predicate) : items;
};

export const getSuggestionsUserStats = async (
    _cnf: typeof config,
    id: string,
    options: GetSuggestedEditsStatsOptions = {}
) => {
    const url = new URL(`${API_BASE}/${API_VER}/users/${id}/suggested-edits`);

    const params: Record<string, string> = {
        site: options.site || DEF_SITE,
    };

    if (Object.keys(options).length) {
        const { from, to = new Date() } = options;

        if (from) params.from = toApiDate(from);
        if (to) params.to = toApiDate(to);
    }

    url.search = new URLSearchParams(params).toString();

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const { items }: StackAPIBatchResponse<SuggestedEditInfo> =
        await res.json();

    return items;
};

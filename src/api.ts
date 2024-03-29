import {
    SuggestedEdit,
    Wrappers,
} from "@userscripters/stackexchange-api-types";
import { API_BASE, API_KEY, API_VER, config, DEF_SITE } from "./config";
import { toApiDate } from "./utils";

export type CommonOptions = {
    site?: string;
};

export type SuggestedEditStatus = "approved" | "rejected" | "all" | "pending";

type SuggestedEditsByPostOptions = {
    type?: SuggestedEditStatus;
} & CommonOptions;

type GetSuggestedEditsStatsOptions = {
    from?: Date;
    page?: number;
    to?: Date;
    site?: string;
};

type SuggestedEditsFilters = {
    [P in SuggestedEditStatus]?: (val: SuggestedEdit) => boolean;
};

/**
 * @see https://api.stackexchange.com/docs/suggested-edits-by-ids
 *
 * @summary gets information about the suggested edit
 * @param itemId id of the suggested edit item
 * @param options request configuration
 */
export const getSuggestionInfo = async (
    itemId: string | number,
    options: CommonOptions = {}
) => {
    const { site = DEF_SITE } = options;

    const url = new URL(`${API_BASE}/${API_VER}/suggested-edits/${itemId}`);
    url.search = new URLSearchParams({ key: API_KEY, site }).toString();

    const res = await fetch(url.toString());
    if (!res.ok) return;

    const { items } = <Wrappers.CommonWrapperObject<SuggestedEdit>>(
        await res.json()
    );

    return items[0];
};

/**
 * @see https://api.stackexchange.com/docs/posts-on-suggested-edits
 *
 * @summary gets suggested edits by post
 * @param postId id of the post to get suggested edits for
 * @param options request configuration
 */
export const getSuggestionsByPost = async (
    postId: string,
    options: SuggestedEditsByPostOptions = {}
) => {
    const { site = DEF_SITE, type = "all" } = options;

    const url = new URL(
        `${API_BASE}/${API_VER}/posts/${postId}/suggested-edits`
    );
    url.search = new URLSearchParams({ key: API_KEY, site }).toString();

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const { items } = <Wrappers.CommonWrapperObject<SuggestedEdit>>(
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
): Promise<SuggestedEdit[]> => {
    const { from, to, page = 1 } = options;

    const url = new URL(`${API_BASE}/${API_VER}/users/${id}/suggested-edits`);

    const params: Record<string, string> = {
        key: API_KEY,
        pagesize: "100",
        page: page.toFixed(0),
        site: options.site || DEF_SITE,
    };

    if (from) params.from = toApiDate(from);
    if (to) params.to = toApiDate(to);

    url.search = new URLSearchParams(params).toString();

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const { items, has_more }: Wrappers.CommonWrapperObject<SuggestedEdit> =
        await res.json();

    if (has_more) {
        const more = await getSuggestionsUserStats(_cnf, id, {
            ...options,
            page: (options.page || 1) + 1,
        });

        return [...items, ...more];
    }

    return items;
};

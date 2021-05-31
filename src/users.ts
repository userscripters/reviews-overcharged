import { StackAPIBatchResponse } from "./api";
import { API_BASE, API_VER, config, DEF_SITE } from "./config";

export type UserType =
    | "unregistered"
    | "registered"
    | "moderator"
    | "team_admin"
    | "does_not_exist";

export type BadgeCounts = {
    bronze: number;
    silver: number;
    gold: number;
};

export type UserInfo = {
    creation_date: number;
    is_employee: boolean;
    last_access_date: number;
    last_modified_date: number;
    reputation: number;
    reputation_change_day: number;
    reputation_change_month: number;
    reputation_change_quarter: number;
    reputation_change_week: number;
    reputation_change_year: number;
    user_id: number;
    display_name: string;
    website_url: string;
    profile_image: string;
    link: string;
    location: string;
    user_type: UserType;
    badge_counts: BadgeCounts;
};

export const getUserInfo = async (
    { filters: { unsafe } }: typeof config,
    id: string,
    site = DEF_SITE
) => {
    const url = new URL(`${API_BASE}/${API_VER}/users/${id}`);
    url.search = new URLSearchParams({ site, filter: unsafe }).toString();
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const {
        items: [userInfo],
    }: StackAPIBatchResponse<UserInfo> = await res.json();
    return userInfo;
};

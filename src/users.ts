import { User, Wrappers } from "@userscripters/stackexchange-api-types";
import { API_BASE, API_VER, config, DEF_SITE } from "./config";

export type UserType = User["user_type"];

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
    }: Wrappers.CommonWrapperObject<User> = await res.json();
    return userInfo;
};

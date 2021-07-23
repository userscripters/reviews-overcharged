import { config } from "./config";
import { getReviewId } from "./utils";

/**
 * @summary removes the no longer needed stats sidebar
 */
export const removeExistingSidebars = (cnf: typeof config) => {
    const id = cnf.ids.sidebar.extra;

    const sidebars = [...document.querySelectorAll(`[id^=${id}]`)];
    if (sidebars.length <= 1) return true;

    const currentReviewId = getReviewId();

    const stale = sidebars.filter(({ id }) => !id.includes(currentReviewId));
    stale.forEach((sidebar) => sidebar.remove());

    return true;
};

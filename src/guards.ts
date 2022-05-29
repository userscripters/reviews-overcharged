import { config } from "./config";
import { getTagName } from "./getters";

/**
 * @summary checks if the review item is a tag wiki excerpt edit
 * @param cnf script configuration
 */
export const isTagEdit = async (cnf: typeof config) => {
    try {
        const tagname = await getTagName(cnf.selectors.page.links.excerpt);
        return !!tagname;
    } catch (error) {
        return false;
    }
};
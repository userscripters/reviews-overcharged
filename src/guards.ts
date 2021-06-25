import { config } from "./config";
import { getExcerptName } from "./getters";

export const isExcerpt = (cnf: typeof config) =>
    !!getExcerptName(cnf.selectors.page.links.excerpt);

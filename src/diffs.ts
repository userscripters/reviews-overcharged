import { config } from "./config";

export const decolorDiff = (cnf: typeof config) => {
    const { added, deleted } = cnf.selectors.diffs;

    const addWrapper = document.querySelector<HTMLDivElement>(added);
    const delWrapper = document.querySelector<HTMLDivElement>(deleted);

    if (!addWrapper || !delWrapper) return false;

    addWrapper.style.backgroundColor = "unset";
    delWrapper.style.backgroundColor = "unset";
    return true;
};

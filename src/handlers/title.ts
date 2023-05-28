import { config } from "../config";
import { createGridCell } from "../dom";
import { handleMatchFailure } from "../utils";

export const removeTitleLines = (cnf: typeof config, wrapper?: Element) =>
    (wrapper || document)
        .querySelectorAll(cnf.selectors.title.description)
        .forEach((elem) => elem.remove());

export const optimizePageTitle = (cnf: typeof config) => {
    const titleSelector = cnf.selectors.title.title;

    const titleWrap = document.querySelector(titleSelector);
    if (!titleWrap) return handleMatchFailure(titleSelector, false);

    titleWrap.classList.add(cnf.classes.grid.container);

    const header = document.querySelector(cnf.selectors.title.header);

    const titleCell = createGridCell(cnf);
    titleCell.classList.add("ml12");
    if (header) titleCell.append(header);

    const learnMoreBtn = titleWrap.querySelector(cnf.selectors.title.learnMore);

    const linkCell = titleCell.cloneNode() as HTMLDivElement;
    if (learnMoreBtn) linkCell.append(learnMoreBtn);

    removeTitleLines(cnf, titleWrap);

    titleWrap.append(titleCell, linkCell);
    return true;
};

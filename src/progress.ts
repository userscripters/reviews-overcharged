import { selectActions } from "./actions";
import { config } from "./config";
import { goParentUp } from "./domUtils";
import { toPercent, trimNumericString } from "./utils";

export const removeProgressBar = (reviewStatsElement: Element) => {
    const wrapper = goParentUp(reviewStatsElement, 3);
    if (!wrapper) return false;
    wrapper.remove();
    return true;
};

export const moveProgressToTabs = (cnf: typeof config) => {
    const {
        selectors: { reviews },
    } = cnf;

    const actions = selectActions(cnf);
    const action = actions.find(({ href }) =>
        /\/review\/suggested-edits/.test(href)
    );

    const dailyElem = document.querySelector(reviews.daily);
    const reviewedElem = document.querySelector(reviews.done);

    if (!dailyElem || !reviewedElem) return false;

    const daily = trimNumericString(dailyElem.textContent || "0");
    const reviewed = trimNumericString(reviewedElem.textContent || "0");

    const ratio = +reviewed / +daily;
    const percentDone = toPercent(ratio);

    if (!action) return false;
    const { style } = action;

    style.background = `linear-gradient(90deg, var(--theme-primary-color) ${percentDone}, var(--black-075) ${percentDone})`;
    style.color = `var(--black-600)`;

    action.textContent += ` (${reviewed}/${daily})`;

    return removeProgressBar(dailyElem);
};

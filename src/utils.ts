export const handleMatchFailure = <R extends null | false>(
    selector: string,
    returnValue: R
) => {
    console.debug(`Couldn't find the element with selector: ${selector}`);
    return returnValue;
};

export const last = <A extends any[]>(arr: A): A[number] => arr[arr.length - 1];

type SafeMatchReturn = [full: string, group1: string, ...others: string[]];

export const safeMatch = (text: string, regex: RegExp, def = "") =>
    (text.match(regex) || [text, def]).slice(1) as SafeMatchReturn;

export const scase = (word: string) =>
    word[0].toUpperCase() + word.slice(1).toLowerCase();

export const toApiDate = (date: Date) => (date.valueOf() / 1e3).toString();

/**
 * @summary formats ratio as percentage
 * @param ratio decimal ratio
 * @param fractions fractional digits
 */
export const toPercent = (ratio: number, fractions = 0) => {
    const percent = ratio * 100;

    return `${percent.toFixed(
        percent !== Math.trunc(percent) ? fractions : 0
    )}%`;
}

export const trimNumericString = (text: string) => text.replace(/\D/g, "");

export const getReviewId = () => last(location.href.split("/"));

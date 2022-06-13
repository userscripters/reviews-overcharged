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

/**
 * @summary delays execution for a given number of milliseconds
 * @param ms milliseconds to delay for
 */
export const delay = (ms = 100) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

/**
 * @summary pluralizes a string
 * @param num number of entities represented by the countable noun
 * @param singular singular form of the noun
 * @param plural plural form of the noun (defaults to {@link singular} + s)
 */
export const pluralize = (num: number, singular: string, plural = `${singular}s`) => {
    return `${num} ${num === 1 ? singular : plural}`;
};

/**
 * @summary prepares a given {@link name} to be set on a {@link DOMStringMap}
 * @param name property name to normalize
 */
export const normalizeDatasetPropName = (name: string) => {
    return name.replace(/\s+/g, "-").toLowerCase();
};
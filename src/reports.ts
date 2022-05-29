/**
 * @summary reports status for each of the handlers run
 * @param scriptName name of the userscript
 * @param names handler names
 * @param statuses handler runs statuses
 */
export const reportHandlersStatus = (scriptName: string, names: string[], statuses: boolean[]) => {
    const statusMsg = statuses.reduce(
        (acc, v, i) => `${acc}\n${names[i]} - ${v ? "success" : "failure"}`,
        `[${scriptName}] handler run:`
    );

    console.debug(statusMsg);
};
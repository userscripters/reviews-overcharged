import { config } from "./config";

/**
 * @summary adds a notification that this is a review audit
 * @param cnf script configuration
 */
export const addAuditNotification = (
    cnf: typeof config,
) => {
    const { selectors: { content } } = cnf;

    const auditId = "audit_notification";

    if (document.getElementById(auditId)) return true; //early exit if already added

    const editTypeHint = document.querySelector(content.typeHint);
    const summary = document.querySelector(content.postSummary);

    if (!editTypeHint) return false;

    const quote = document.createElement("blockquote");
    quote.id = auditId;
    quote.classList.add("mb12", "fs-headline1");
    quote.textContent = "This is an Audit. Tread carefully";

    editTypeHint.after(quote);
    editTypeHint.remove();
    summary?.remove();

    return true;
};

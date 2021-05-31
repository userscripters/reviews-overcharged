import { getSuggestionsByPost } from "./api";
import { config } from "./config";

export const addAuditNotification = async (
    { selectors: { content } }: typeof config,
    postId: string
) => {
    const auditId = "audit_notification";

    if (document.getElementById(auditId)) return true; //early exit if already added

    const { length } = await getSuggestionsByPost(postId, {
        type: "pending",
    });
    if (length) return true;

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

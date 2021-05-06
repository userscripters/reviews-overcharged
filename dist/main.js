"use strict";
(async () => {
    const API_BASE = "https://api.stackexchange.com";
    const API_VER = 2.2;
    const config = {
        classes: {
            grid: {
                container: "grid",
                cell: "grid--cell",
            },
        },
        selectors: {
            actions: {
                sidebar: ".js-actions-sidebar",
                modal: {
                    form: "form[action='/suggested-edits/reject']",
                    votes: {
                        labels: "label[for^=rejection-reason].s-label",
                        counts: ".s-badge__votes",
                    },
                },
                inputs: {
                    reject: "#review-action-Reject",
                },
            },
            buttons: {
                submit: ".js-review-submit",
                skip: ".js-review-actions:not(.d-none) .js-action-button[value=1]",
                close: ".s-modal--close",
            },
            reviews: {
                done: ".js-reviews-done",
                daily: ".js-reviews-per-day",
            },
            diffs: {
                deleted: ".full-diff .deleted > div",
                added: ".full-diff .inserted > div",
            },
            title: {
                description: ".s-page-title--description",
                actions: ".s-page-title--actions a",
                learnMore: ".js-show-modal-from-nav.s-link",
                title: ".s-page-title--text",
                header: ".s-page-title--header",
            },
            info: {
                post: {
                    wrapper: ".postcell span",
                },
                editor: {
                    card: "a.s-user-card--link",
                },
            },
        },
    };
    const handleMatchFailure = (selector, returnValue) => {
        console.debug(`Couldn't find the element with selector: ${selector}`);
        return returnValue;
    };
    const selectActions = () => Array.from(document.querySelectorAll(config.selectors.title.actions));
    const getUserInfo = async (id, site = "stackoverflow") => {
        const url = new URL(`${API_BASE}/${API_VER}/users/${id}`);
        url.search = new URLSearchParams({ site }).toString();
        const res = await fetch(url.toString());
        if (!res.ok)
            return null;
        const { items: [userInfo], } = await res.json();
        return userInfo;
    };
    const toApiDate = (date) => (date.valueOf() / 1e3).toString();
    const getSuggestionsUserStats = async (id, options = {}) => {
        const url = new URL(`${API_BASE}/${API_VER}/users/${id}/suggested-edits`);
        const params = {
            site: options.site || "stackoverflow",
        };
        if (Object.keys(options).length) {
            const { from, to = new Date() } = options;
            if (from)
                params.from = toApiDate(from);
            if (to)
                params.to = toApiDate(to);
        }
        url.search = new URLSearchParams(params).toString();
        const res = await fetch(url.toString());
        if (!res.ok)
            return [];
        const { items, } = await res.json();
        return items;
    };
    const getEditAuthorId = () => {
        const postWrapSelector = config.selectors.info.post.wrapper;
        const spans = document.querySelectorAll(postWrapSelector);
        if (!spans.length)
            return handleMatchFailure(postWrapSelector, null);
        const userSpan = Array.from(spans).find(({ textContent }) => /proposed/i.test(textContent || ""));
        if (!userSpan)
            return null;
        const cardSelector = config.selectors.info.editor.card;
        const { parentElement } = userSpan;
        const link = parentElement.querySelector(cardSelector);
        if (!link)
            return handleMatchFailure(cardSelector, null);
        const { href } = link;
        const [, userId] = href.match(/users\/(\d+)/) || [];
        if (!userId)
            return null;
        return userId;
    };
    const createGridCell = () => {
        const elem = document.createElement("div");
        elem.classList.add(config.classes.grid.cell);
        return elem;
    };
    const createItem = (...contents) => {
        const elem = document.createElement("div");
        elem.classList.add(config.classes.grid.cell, "p12");
        elem.append(...contents);
        return elem;
    };
    const text = (text) => document.createTextNode(text);
    const br = () => document.createElement("br");
    const a = (link, text = link) => {
        const anchor = document.createElement("a");
        anchor.href = link;
        anchor.textContent = text;
        anchor.target = "_blank";
        anchor.referrerPolicy = "no-referrer";
        return anchor;
    };
    const p = (text) => {
        const par = document.createElement("p");
        par.style.marginBottom = "0";
        par.innerText = text;
        return par;
    };
    const li = (content) => {
        const item = document.createElement("li");
        if (typeof content === "string") {
            item.textContent = content;
            return item;
        }
        item.append(content);
        return item;
    };
    const ul = ({ header, items }) => {
        const list = document.createElement("ul");
        const { style } = list;
        style.listStyle = "none";
        style.margin = "0";
        if (header) {
            const head = document.createElement("h3");
            head.classList.add("mb8");
            head.textContent = header;
            list.append(head);
        }
        const listItems = items.map(li);
        list.append(...listItems);
        return list;
    };
    const createEditAuthorItem = ({ display_name, reputation, link, }) => {
        const namePar = p(`Name: `);
        namePar.append(a(link, display_name));
        return createItem(ul({
            header: "Edit Author",
            items: [namePar, `Reputation: ${reputation}`],
        }));
    };
    const toPercent = (ratio) => `${Math.trunc(ratio * 100)}%`;
    const getSuggestionTotals = (suggestions) => {
        const stats = {
            get ratio() {
                const { approved, rejected, total } = this;
                return {
                    ofApproved: approved / total,
                    ofRejected: rejected / total,
                    approvedToRejected: approved / (rejected === 0 ? 1 : rejected),
                };
            },
            approved: 0,
            rejected: 0,
            total: 0,
        };
        suggestions.forEach(({ approval_date, rejection_date }) => {
            stats.total += 1;
            if (approval_date)
                stats.approved += 1;
            if (rejection_date)
                stats.rejected += 1;
        });
        return stats;
    };
    const decolorDiff = (cnf) => {
        const { added, deleted } = cnf.selectors.diffs;
        const addWrapper = document.querySelector(added);
        const delWrapper = document.querySelector(deleted);
        if (!addWrapper || !delWrapper)
            return false;
        addWrapper.style.backgroundColor = "unset";
        delWrapper.style.backgroundColor = "unset";
        return true;
    };
    const createEditorStatsItem = ({ link }, suggestions) => {
        const { approved, rejected, total, ratio: { approvedToRejected, ofApproved, ofRejected }, } = getSuggestionTotals(suggestions);
        const itemParams = {
            header: "Author Stats",
            items: [],
        };
        if (!total) {
            const infoPar = p(`Tag wiki/excerpt edits are not returned.`);
            infoPar.append(br(), text(`See their `), a(`${link}?tab=activity`, "activity tab"));
            itemParams.items.push(infoPar);
            return createItem(ul(itemParams));
        }
        itemParams.items.push(`Approved: ${approved} (${toPercent(ofApproved)})`, `Rejected: ${rejected} (${toPercent(ofRejected)})`, `Of total: ${total}`, `Ratio: ${approvedToRejected}`);
        return createItem(ul(itemParams));
    };
    const trimNumericString = (text) => text.replace(/\D/g, "");
    const goParentUp = (element, times = 1) => {
        if (times === 0 || !element)
            return element;
        return goParentUp(element.parentElement, times - 1);
    };
    const arraySelect = (ctxt, selector) => Array.from(ctxt.querySelectorAll(selector));
    const removeProgressBar = (reviewStatsElement) => {
        const wrapper = goParentUp(reviewStatsElement, 3);
        if (!wrapper)
            return false;
        wrapper.remove();
        return true;
    };
    const removeTitleLines = (cnf, wrapper) => (wrapper || document)
        .querySelectorAll(cnf.selectors.title.description)
        .forEach((elem) => elem.remove());
    const optimizePageTitle = (cnf) => {
        const titleSelector = cnf.selectors.title.title;
        const titleWrap = document.querySelector(titleSelector);
        if (!titleWrap)
            return handleMatchFailure(titleSelector, false);
        titleWrap.classList.add(cnf.classes.grid.container);
        const header = document.querySelector(cnf.selectors.title.header);
        const titleCell = createGridCell();
        titleCell.classList.add("ml12");
        if (header)
            titleCell.append(header);
        const learnMoreBtn = titleWrap.querySelector(cnf.selectors.title.learnMore);
        const linkCell = titleCell.cloneNode();
        if (learnMoreBtn)
            linkCell.append(learnMoreBtn);
        removeTitleLines(cnf, titleWrap);
        titleWrap.append(titleCell, linkCell);
        return true;
    };
    const moveProgressToTabs = ({ selectors }) => {
        const actions = selectActions();
        const action = actions.find(({ href }) => /\/review\/suggested-edits/.test(href));
        const dailyElem = document.querySelector(selectors.reviews.daily);
        const reviewedElem = document.querySelector(selectors.reviews.done);
        if (!dailyElem || !reviewedElem)
            return false;
        const daily = trimNumericString(dailyElem.textContent || "0");
        const reviewed = trimNumericString(reviewedElem.textContent || "0");
        const ratio = +reviewed / +daily;
        const percentDone = toPercent(ratio);
        if (!action)
            return false;
        const { style } = action;
        style.background = `linear-gradient(90deg, var(--theme-primary-color) ${percentDone}, var(--black-075) ${percentDone})`;
        style.color = `var(--black-600)`;
        action.textContent += ` (${reviewed}/${daily})`;
        return removeProgressBar(dailyElem);
    };
    const callRejectionModal = (cnf) => {
        const { selectors: { buttons, actions: { inputs, modal }, }, } = cnf;
        const rejectInput = document.querySelector(inputs.reject);
        const submitButton = document.querySelector(buttons.submit);
        if (!rejectInput || !submitButton)
            return null;
        rejectInput.click();
        submitButton.click();
        const modalWrapper = document.querySelector(modal.form);
        if (!modalWrapper)
            return null;
        const dolly = modalWrapper.cloneNode(true);
        const closeBtn = modalWrapper.querySelector(buttons.close);
        closeBtn.click();
        return dolly;
    };
    const getRejectionCount = (cnf) => {
        const { selectors: { actions: { modal }, }, } = cnf;
        const modalWrapper = callRejectionModal(cnf);
        if (!modalWrapper)
            return handleMatchFailure(modal.form, null);
        console.log({ modalWrapper });
        const withVotes = arraySelect(modalWrapper, modal.votes.labels);
        const count = {
            spam: 0,
            improvement: 0,
            intent: 0,
            reply: 0,
            harm: 0,
        };
        const reasonMap = {
            102: "improvement",
            101: "spam",
            104: "intent",
            105: "reply",
            0: "harm",
        };
        const voteSelector = modal.votes.counts;
        withVotes.forEach((label) => {
            const { htmlFor } = label;
            const [_full, reasonId] = htmlFor.match(/(\d+$)/) || [];
            const reason = reasonMap[reasonId];
            if (label.querySelector(voteSelector))
                count[reason] += 1;
        });
        return count;
    };
    const scase = (word) => word[0].toUpperCase() + word.slice(1).toLowerCase();
    const createRejectionCountItem = (count) => {
        const withVotes = Object.entries(count).filter(([_k, v]) => !!v);
        const items = withVotes.map(([k, v]) => `${scase(k)}: ${v}`);
        return createItem(ul({ items, header: "Reject votes" }));
    };
    const addStatsSidebar = async (cnf) => {
        const sidebar = document.querySelector(cnf.selectors.actions.sidebar);
        if (!sidebar)
            return false;
        const dialog = document.createElement("div");
        dialog.classList.add("s-sidebarwidget", "ml24", "mt24");
        const header = document.createElement("div");
        header.classList.add("s-sidebarwidget--header");
        header.textContent = "Extra Info";
        const itemWrap = document.createElement("div");
        itemWrap.classList.add(cnf.classes.grid.container, "fd-column");
        const authorId = getEditAuthorId();
        if (!authorId)
            return false;
        const [editAuthorInfo, editAuthorStats] = await Promise.all([
            getUserInfo(authorId),
            getSuggestionsUserStats(authorId),
        ]);
        const rejectCount = getRejectionCount(cnf);
        if (!editAuthorInfo || !rejectCount)
            return false;
        const items = [];
        items.push(createEditAuthorItem(editAuthorInfo), createEditorStatsItem(editAuthorInfo, editAuthorStats), createRejectionCountItem(rejectCount));
        itemWrap.append(...items);
        dialog.append(header, itemWrap);
        editAuthorInfo && sidebar.append(dialog);
        return true;
    };
    const handlerMap = {
        moveProgressToTabs,
        optimizePageTitle,
        decolorDiff,
    };
    const statuses = Object.entries(handlerMap).map(([key, handler]) => [
        key,
        handler(config),
    ]);
    const statusMsg = statuses.reduce((acc, [k, v]) => `${acc}\n${k} - ${v ? "ok" : "failed"}`, "Status: ");
    console.debug(statusMsg);
    await addStatsSidebar(config);
})();

"use strict";
(async () => {
    const API_BASE = "https://api.stackexchange.com";
    const API_VER = 2.2;
    const config = {
        selectors: {
            actions: ".s-page-title--actions a",
            reviews: {
                done: ".js-reviews-done",
                daily: ".js-reviews-per-day",
            },
            title: {
                description: ".s-page-title--description",
                learnMore: ".js-show-modal-from-nav.s-link",
                title: ".s-page-title--text",
                header: ".s-page-title--header",
            },
        },
    };
    const selectActions = () => Array.from(document.querySelectorAll(config.selectors.actions));
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
        const spans = document.querySelectorAll(".postcell span");
        if (!spans.length)
            return null;
        const userSpan = Array.from(spans).find(({ textContent }) => /proposed/i.test(textContent || ""));
        if (!userSpan)
            return null;
        const { parentElement } = userSpan;
        const link = parentElement.querySelector("a.s-user-card--link");
        if (!link)
            return null;
        const { href } = link;
        const [, userId] = href.match(/users\/(\d+)/) || [];
        if (!userId)
            return null;
        return userId;
    };
    const createGridCell = () => {
        const elem = document.createElement("div");
        elem.classList.add("grid--cell");
        return elem;
    };
    const createItem = (...contents) => {
        const elem = document.createElement("div");
        elem.classList.add("grid--cell", "p12");
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
        const titleWrap = document.querySelector(cnf.selectors.title.title);
        if (!titleWrap)
            return false;
        titleWrap.classList.add("grid");
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
    const moveProgressToTabs = () => {
        const actions = selectActions();
        const action = actions.find(({ href }) => /\/review\/suggested-edits/.test(href));
        const dailyElem = document.querySelector(config.selectors.reviews.daily);
        const reviewedElem = document.querySelector(config.selectors.reviews.done);
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
    const addStatsSidebar = async () => {
        const sidebar = document.querySelector(".js-actions-sidebar");
        if (!sidebar)
            return false;
        const dialog = document.createElement("div");
        dialog.classList.add("s-sidebarwidget", "ml24", "mt24");
        const header = document.createElement("div");
        header.classList.add("s-sidebarwidget--header");
        header.textContent = "Extra Info";
        const itemWrap = document.createElement("div");
        itemWrap.classList.add("grid", "fd-column");
        const authorId = getEditAuthorId();
        if (!authorId)
            return false;
        const [editAuthorInfo, editAuthorStats] = await Promise.all([
            getUserInfo(authorId),
            getSuggestionsUserStats(authorId),
        ]);
        if (!editAuthorInfo)
            return false;
        const items = [];
        items.push(createEditAuthorItem(editAuthorInfo));
        items.push(createEditorStatsItem(editAuthorInfo, editAuthorStats));
        itemWrap.append(...items);
        dialog.append(header, itemWrap);
        editAuthorInfo && sidebar.append(dialog);
        return true;
    };
    moveProgressToTabs();
    addStatsSidebar();
    optimizePageTitle(config);
})();

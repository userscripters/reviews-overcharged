"use strict";
(async () => {
    const API_BASE = "https://api.stackexchange.com";
    const API_VER = 2.2;
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
    const createEditAuthorItem = ({ display_name, reputation }) => {
        return createItem(ul({
            header: "Edit Author",
            items: [`Name: ${display_name}`, `Reputation: ${reputation}`],
        }));
    };
    const toPercent = (ratio) => `${ratio * 100}%`;
    const getSuggestionTotals = (suggestions) => {
        const stats = {
            get ratio() {
                const { approved, rejected, total } = this;
                return {
                    ofApproved: approved / total,
                    ofRejected: rejected / total,
                    approvedToRejected: approved / rejected,
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
    const createEditStatsItem = ({ link }, suggestions) => {
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
        itemParams.items.push(`Approved: ${approved} (${toPercent(ofApproved)})`, `Rejected: ${rejected} (${toPercent(ofRejected)})`, `Ratio: ${approvedToRejected}`, `Of total: ${total}`);
        return createItem(ul(itemParams));
    };
    const sidebar = document.querySelector(".js-actions-sidebar");
    if (!sidebar)
        return;
    const dialog = document.createElement("div");
    dialog.classList.add("s-sidebarwidget", "ml24", "mt24");
    const header = document.createElement("div");
    header.classList.add("s-sidebarwidget--header");
    header.textContent = "Extra Info";
    const itemWrap = document.createElement("div");
    itemWrap.classList.add("grid", "fd-column");
    const authorId = getEditAuthorId();
    if (!authorId)
        return;
    const [editAuthorInfo, editAuthorStats] = await Promise.all([
        getUserInfo(authorId),
        getSuggestionsUserStats(authorId),
    ]);
    if (!editAuthorInfo)
        return;
    const items = [];
    items.push(createEditAuthorItem(editAuthorInfo));
    items.push(createEditStatsItem(editAuthorInfo, editAuthorStats));
    itemWrap.append(...items);
    dialog.append(header, itemWrap);
    editAuthorInfo && sidebar.append(dialog);
})();

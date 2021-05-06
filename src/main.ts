type StackAPIBatchResponse<T> = {
  has_more: boolean;
  items: T[];
  quota_max: number;
  quota_remaining: number;
};

type ReputationInfo = {
  on_date: number;
  post_id: number;
  post_type: "answer" | "question";
  reputation_change: number;
  user_id: number;
  vote_type: "up_votes";
};

type UserType =
  | "unregistered"
  | "registered"
  | "moderator"
  | "team_admin"
  | "does_not_exist";

type BadgeCounts = {
  bronze: number;
  silver: number;
  gold: number;
};

type UserInfo = {
  creation_date: number;
  is_employee: boolean;
  last_access_date: number;
  last_modified_date: number;
  reputation: number;
  reputation_change_day: number;
  reputation_change_month: number;
  reputation_change_quarter: number;
  reputation_change_week: number;
  reputation_change_year: number;
  user_id: number;
  display_name: string;
  website_url: string;
  profile_image: string;
  link: string;
  location: string;
  user_type: UserType;
  badge_counts: BadgeCounts;
};

type SuggestedEditInfo = {
  approval_date?: number;
  comment: string;
  creation_date: number;
  post_id: number;
  post_type: "question" | "answer" | "article";
  proposing_user?: {}; //TODO: expand
  rejection_date?: string;
  suggested_edit_id: number;
  tags: string[];
  title: string;
};

type GetSuggestedEditsStatsOptions = {
  from?: Date;
  to?: Date;
  site?: string;
};

type ListOptions = { header?: string; items: (string | HTMLElement)[] };

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

  const handleMatchFailure = <R extends null | false>(
    selector: string,
    returnValue: R
  ) => {
    console.debug(`Couldn't find the element with selector: ${selector}`);
    return returnValue;
  };

  const selectActions = () =>
    Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        config.selectors.title.actions
      )
    );

  const getUserInfo = async (id: string, site = "stackoverflow") => {
    const url = new URL(`${API_BASE}/${API_VER}/users/${id}`);
    url.search = new URLSearchParams({ site }).toString();
    const res = await fetch(url.toString());
    if (!res.ok) return null;

    const {
      items: [userInfo],
    }: StackAPIBatchResponse<UserInfo> = await res.json();
    return userInfo;
  };

  const toApiDate = (date: Date) => (date.valueOf() / 1e3).toString();

  const getSuggestionsUserStats = async (
    id: string,
    options: GetSuggestedEditsStatsOptions = {}
  ) => {
    const url = new URL(`${API_BASE}/${API_VER}/users/${id}/suggested-edits`);

    const params: Record<string, string> = {
      site: options.site || "stackoverflow",
    };

    if (Object.keys(options).length) {
      const { from, to = new Date() } = options;

      if (from) params.from = toApiDate(from);
      if (to) params.to = toApiDate(to);
    }

    url.search = new URLSearchParams(params).toString();

    const res = await fetch(url.toString());
    if (!res.ok) return [];

    const {
      items,
    }: StackAPIBatchResponse<SuggestedEditInfo> = await res.json();

    return items;
  };

  const getEditAuthorId = () => {
    const postWrapSelector = config.selectors.info.post.wrapper;

    const spans = document.querySelectorAll(postWrapSelector);
    if (!spans.length) return handleMatchFailure(postWrapSelector, null);

    const userSpan = Array.from(spans).find(({ textContent }) =>
      /proposed/i.test(textContent || "")
    );
    if (!userSpan) return null;

    const cardSelector = config.selectors.info.editor.card;

    const { parentElement } = userSpan;
    const link = parentElement!.querySelector<HTMLAnchorElement>(cardSelector);
    if (!link) return handleMatchFailure(cardSelector, null);

    const { href } = link;
    const [, userId] = href.match(/users\/(\d+)/) || [];
    if (!userId) return null;

    return userId;
  };

  const createGridCell = () => {
    const elem = document.createElement("div");
    elem.classList.add(config.classes.grid.cell);
    return elem;
  };

  const createItem = (...contents: Node[]) => {
    const elem = document.createElement("div");
    elem.classList.add(config.classes.grid.cell, "p12");
    elem.append(...contents);
    return elem;
  };

  const text = (text: string) => document.createTextNode(text);

  const br = () => document.createElement("br");

  const a = (link: string, text = link) => {
    const anchor = document.createElement("a");
    anchor.href = link;
    anchor.textContent = text;
    anchor.target = "_blank";
    anchor.referrerPolicy = "no-referrer";
    return anchor;
  };

  const p = (text: string) => {
    const par = document.createElement("p");
    par.style.marginBottom = "0";
    par.innerText = text;
    return par;
  };

  const li = (content: string | HTMLElement) => {
    const item = document.createElement("li");

    if (typeof content === "string") {
      item.textContent = content;
      return item;
    }

    item.append(content);
    return item;
  };

  const ul = ({ header, items }: ListOptions) => {
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

  const createEditAuthorItem = ({
    display_name,
    reputation,
    link,
  }: UserInfo) => {
    const namePar = p(`Name: `);
    namePar.append(a(link, display_name));

    return createItem(
      ul({
        header: "Edit Author",
        items: [namePar, `Reputation: ${reputation}`],
      })
    );
  };

  const toPercent = (ratio: number) => `${Math.trunc(ratio * 100)}%`;

  const getSuggestionTotals = (suggestions: SuggestedEditInfo[]) => {
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
      if (approval_date) stats.approved += 1;
      if (rejection_date) stats.rejected += 1;
    });

    return stats;
  };

  const decolorDiff = (cnf: typeof config) => {
    const { added, deleted } = cnf.selectors.diffs;

    const addWrapper = document.querySelector<HTMLDivElement>(added);
    const delWrapper = document.querySelector<HTMLDivElement>(deleted);

    if (!addWrapper || !delWrapper) return false;

    addWrapper.style.backgroundColor = "unset";
    delWrapper.style.backgroundColor = "unset";
    return true;
  };

  const createEditorStatsItem = (
    { link }: UserInfo,
    suggestions: SuggestedEditInfo[]
  ) => {
    const {
      approved,
      rejected,
      total,
      ratio: { approvedToRejected, ofApproved, ofRejected },
    } = getSuggestionTotals(suggestions);

    const itemParams: ListOptions = {
      header: "Author Stats",
      items: [],
    };

    if (!total) {
      const infoPar = p(`Tag wiki/excerpt edits are not returned.`);

      infoPar.append(
        br(),
        text(`See their `),
        a(`${link}?tab=activity`, "activity tab")
      );

      itemParams.items.push(infoPar);
      return createItem(ul(itemParams));
    }

    itemParams.items.push(
      `Approved: ${approved} (${toPercent(ofApproved)})`,
      `Rejected: ${rejected} (${toPercent(ofRejected)})`,
      `Of total: ${total}`,
      `Ratio: ${approvedToRejected}`
    );

    return createItem(ul(itemParams));
  };

  const trimNumericString = (text: string) => text.replace(/\D/g, "");

  const goParentUp = (element: Element | null, times = 1): Element | null => {
    if (times === 0 || !element) return element;
    return goParentUp(element.parentElement, times - 1);
  };

  const arraySelect = <R extends Element = Element>(
    ctxt: Element,
    selector: string
  ) => Array.from(ctxt.querySelectorAll<R>(selector));

  const removeProgressBar = (reviewStatsElement: Element) => {
    const wrapper = goParentUp(reviewStatsElement, 3);
    if (!wrapper) return false;
    wrapper.remove();
    return true;
  };

  const removeTitleLines = (cnf: typeof config, wrapper?: Element) =>
    (wrapper || document)
      .querySelectorAll(cnf.selectors.title.description)
      .forEach((elem) => elem.remove());

  const optimizePageTitle = (cnf: typeof config) => {
    const titleSelector = cnf.selectors.title.title;

    const titleWrap = document.querySelector(titleSelector);
    if (!titleWrap) return handleMatchFailure(titleSelector, false);

    titleWrap.classList.add(cnf.classes.grid.container);

    const header = document.querySelector(cnf.selectors.title.header);

    const titleCell = createGridCell();
    titleCell.classList.add("ml12");
    if (header) titleCell.append(header);

    const learnMoreBtn = titleWrap.querySelector(cnf.selectors.title.learnMore);

    const linkCell = titleCell.cloneNode() as HTMLDivElement;
    if (learnMoreBtn) linkCell.append(learnMoreBtn);

    removeTitleLines(cnf, titleWrap);

    titleWrap.append(titleCell, linkCell);
    return true;
  };

  const moveProgressToTabs = ({ selectors }: typeof config) => {
    const actions = selectActions();
    const action = actions.find(({ href }) =>
      /\/review\/suggested-edits/.test(href)
    );

    const dailyElem = document.querySelector(selectors.reviews.daily);
    const reviewedElem = document.querySelector(selectors.reviews.done);

    if (!dailyElem || !reviewedElem) return false;

    const daily = trimNumericString(dailyElem!.textContent || "0");
    const reviewed = trimNumericString(reviewedElem!.textContent || "0");

    const ratio = +reviewed / +daily;
    const percentDone = toPercent(ratio);

    if (!action) return false;
    const { style } = action;

    style.background = `linear-gradient(90deg, var(--theme-primary-color) ${percentDone}, var(--black-075) ${percentDone})`;
    style.color = `var(--black-600)`;

    action.textContent += ` (${reviewed}/${daily})`;

    return removeProgressBar(dailyElem);
  };

  type RejectionCount = {
    spam: number;
    improvement: number;
    intent: number;
    reply: number;
    harm: number;
  };

  const callRejectionModal = (cnf: typeof config) => {
    const {
      selectors: {
        buttons,
        actions: { inputs, modal },
      },
    } = cnf;

    const rejectInput = document.querySelector<HTMLInputElement>(inputs.reject);
    const submitButton = document.querySelector<HTMLButtonElement>(
      buttons.submit
    );
    if (!rejectInput || !submitButton) return null;

    rejectInput.click();
    submitButton.click();

    const modalWrapper = document.querySelector<HTMLFormElement>(modal.form);
    if (!modalWrapper) return null;

    const dolly = modalWrapper.cloneNode(true) as HTMLDivElement;

    const closeBtn = modalWrapper.querySelector<HTMLButtonElement>(
      buttons.close
    )!;

    closeBtn.click();
    return dolly;
  };

  const getRejectionCount = (cnf: typeof config) => {
    const {
      selectors: {
        actions: { modal },
      },
    } = cnf;

    const modalWrapper = callRejectionModal(cnf);
    if (!modalWrapper) return handleMatchFailure(modal.form, null);

    console.log({ modalWrapper });

    const withVotes = arraySelect<HTMLLabelElement>(
      modalWrapper,
      modal.votes.labels
    );

    const count: RejectionCount = {
      spam: 0,
      improvement: 0,
      intent: 0,
      reply: 0,
      harm: 0,
    };

    const reasonMap: { [P in keyof RejectionCount as string]: P } = {
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
      if (label.querySelector(voteSelector)) count[reason] += 1;
    });

    return count;
  };

  const scase = (word: string) =>
    word[0].toUpperCase() + word.slice(1).toLowerCase();

  const createRejectionCountItem = (count: RejectionCount) => {
    const withVotes = Object.entries(count).filter(([_k, v]) => !!v);
    const items = withVotes.map(([k, v]) => `${scase(k)}: ${v}`);
    return createItem(ul({ items, header: "Reject votes" }));
  };

  const addStatsSidebar = async (cnf: typeof config) => {
    const sidebar = document.querySelector(cnf.selectors.actions.sidebar);

    if (!sidebar) return false;

    const dialog = document.createElement("div");
    dialog.classList.add("s-sidebarwidget", "ml24", "mt24");

    const header = document.createElement("div");
    header.classList.add("s-sidebarwidget--header");
    header.textContent = "Extra Info";

    const itemWrap = document.createElement("div");
    itemWrap.classList.add(cnf.classes.grid.container, "fd-column");

    const authorId = getEditAuthorId();

    if (!authorId) return false;

    const [editAuthorInfo, editAuthorStats] = await Promise.all([
      getUserInfo(authorId),
      getSuggestionsUserStats(authorId),
    ]);

    const rejectCount = getRejectionCount(cnf);

    if (!editAuthorInfo || !rejectCount) return false;

    const items: HTMLDivElement[] = [];

    items.push(
      createEditAuthorItem(editAuthorInfo),
      createEditorStatsItem(editAuthorInfo, editAuthorStats),
      createRejectionCountItem(rejectCount)
    );

    itemWrap.append(...items);

    dialog.append(header, itemWrap);

    editAuthorInfo && sidebar.append(dialog);

    return true;
  };

  const handlerMap: { [x: string]: (cnf: typeof config) => boolean } = {
    moveProgressToTabs,
    optimizePageTitle,
    decolorDiff,
  };

  const statuses = Object.entries(handlerMap).map(([key, handler]) => [
    key,
    handler(config),
  ]);

  const statusMsg = statuses.reduce(
    (acc, [k, v]) => `${acc}\n${k} - ${v ? "ok" : "failed"}`,
    "Status: "
  );

  console.debug(statusMsg);

  await addStatsSidebar(config);
})();

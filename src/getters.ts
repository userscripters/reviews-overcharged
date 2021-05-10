import { config } from "./config";
import { handleMatchFailure, safeMatch } from "./utils";

export const getAnswerId = (selector: string) => {
  const link = document.querySelector<HTMLAnchorElement>(selector);
  return safeMatch(link?.href || "", /\/questions\/\d+\/[\w-]+\/(\d+)/, "")[0];
};

export const getQuestionId = (selector: string) => {
  const link = document.querySelector<HTMLAnchorElement>(selector);
  return safeMatch(link?.href || "", /\/questions\/(\d+)/, "")[0];
};

export const getPostId = ({
  selectors: {
    page: { links },
  },
}: typeof config) => getAnswerId(links.answer) || getQuestionId(links.question);

export const getEditAuthorId = () => {
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

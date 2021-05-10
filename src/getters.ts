import { config } from "./config";
import { safeMatch } from "./utils";

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

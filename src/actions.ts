import { config } from "./config";

export const selectActions = ({ selectors }: typeof config) => [
    ...document.querySelectorAll<HTMLAnchorElement>(selectors.title.actions),
];

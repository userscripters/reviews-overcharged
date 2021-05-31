import { config } from "./config";

export const createGridCell = () => {
    const elem = document.createElement("div");
    elem.classList.add(config.classes.grid.cell);
    return elem;
};

export const createItem = (...contents: Node[]) => {
    const elem = document.createElement("div");
    elem.classList.add(config.classes.grid.cell, "p12");
    elem.append(...contents);
    return elem;
};

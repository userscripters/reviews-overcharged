import { config } from "./config";

export const createGridCell = ({ classes }: typeof config) => {
    const elem = document.createElement("div");
    elem.classList.add(classes.grid.cell);
    return elem;
};

export const createItem = (...contents: Node[]) => {
    const elem = document.createElement("div");
    elem.classList.add(config.classes.grid.cell, "p12");
    elem.append(...contents);
    return elem;
};

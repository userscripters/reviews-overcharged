export type ListOptions = { header?: string; items: (string | HTMLElement)[] };

export const a = (link: string, text = link) => {
  const anchor = document.createElement("a");
  anchor.href = link;
  anchor.textContent = text;
  anchor.target = "_blank";
  anchor.referrerPolicy = "no-referrer";
  return anchor;
};

export const br = () => document.createElement("br");

export const li = (content: string | HTMLElement) => {
  const item = document.createElement("li");

  if (typeof content === "string") {
    item.textContent = content;
    return item;
  }

  item.append(content);
  return item;
};

export const p = (text: string) => {
  const par = document.createElement("p");
  par.style.marginBottom = "0";
  par.innerText = text;
  return par;
};

export const text = (text: string) => document.createTextNode(text);

export const ul = ({ header, items }: ListOptions) => {
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

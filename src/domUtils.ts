export const arraySelect = <R extends Element = Element>(
  ctxt: Element,
  selector: string
) => Array.from(ctxt.querySelectorAll<R>(selector));

export const goParentUp = (
  element: Element | null,
  times = 1
): Element | null => {
  if (times === 0 || !element) return element;
  return goParentUp(element.parentElement, times - 1);
};

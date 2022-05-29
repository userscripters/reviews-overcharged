export const arraySelect = <R extends Element = Element>(
    ctxt: Element,
    selector: string
) => [...ctxt.querySelectorAll<R>(selector)];

export const goParentUp = (
    element: Element | null,
    times = 1
): Element | null => {
    if (times === 0 || !element) return element;
    return goParentUp(element.parentElement, times - 1);
};

/**
 * @summary waits until elements matching {@link selector} appear in DOM
 * @param selector selector to match
 * @param timeout optional timeout
 */
export const waitForSelector = <T extends Element>(
    selector: string,
    timeout?: number
): Promise<NodeListOf<T>> => {
    const initial = document.querySelectorAll<T>(selector);
    if (initial.length) return Promise.resolve(initial);

    return new Promise((resolve, reject) => {
        const handle = timeout && setTimeout(reject, timeout);

        const observer = new MutationObserver(() => {
            const target = document.querySelectorAll<T>(selector);
            if (!target.length) return;

            clearTimeout(handle);
            observer.disconnect();
            resolve(target);
        });

        observer.observe(document, {
            subtree: true,
            childList: true,
            attributes: true,
        });
    });
};

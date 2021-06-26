import { config } from "./config";
import { arraySelect, waitForSelector } from "./domUtils";
import { handleMatchFailure } from "./utils";

type RejectionReasons =
    | "vandalism"
    | "improvement"
    | "intent"
    | "reply"
    | "harm"
    | "guidance"
    | "copyright"
    | "circular";

export type RejectionCount = { [P in RejectionReasons]: number };

const callRejectionModal = async (cnf: typeof config) => {
    const {
        selectors: {
            buttons,
            actions: { inputs, modal, action, disabled },
        },
    } = cnf;

    const rejectInput = document.querySelector<HTMLInputElement>(inputs.reject);
    const submitButton = document.querySelector<HTMLButtonElement>(
        buttons.submit
    );

    if (!rejectInput || !submitButton) return null;

    await waitForSelector(`${action}:not(${disabled})`);

    rejectInput.click();
    submitButton.click();

    const [modalWrapper] = [
        ...(await waitForSelector<HTMLFormElement>(modal.form)),
    ];

    if (!modalWrapper) return handleMatchFailure(modal.form, null);

    const dolly = modalWrapper.cloneNode(true) as HTMLDivElement;

    const closeBtn = modalWrapper.querySelector<HTMLButtonElement>(
        buttons.close
    )!;

    closeBtn.click();
    return dolly;
};

export const getRejectionCount = async (cnf: typeof config) => {
    const {
        selectors: {
            actions: { modal },
        },
    } = cnf;

    const modalWrapper = await callRejectionModal(cnf);
    if (!modalWrapper) return handleMatchFailure(modal.form, null);

    const withVotes = arraySelect<HTMLLabelElement>(
        modalWrapper,
        modal.votes.labels
    );

    const count: RejectionCount = {
        vandalism: 0,
        improvement: 0,
        intent: 0,
        reply: 0,
        harm: 0,
        guidance: 0,
        copyright: 0,
        circular: 0,
    };

    const reasonMap: { [P in keyof RejectionCount as string]: P } = {
        102: "improvement",
        101: "vandalism",
        104: "intent",
        105: "reply",
        106: "copyright",
        107: "guidance",
        110: "circular",
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

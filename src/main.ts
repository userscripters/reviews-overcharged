import { addAuditNotification } from "./audits";
import { config } from "./config";
import { decolorDiff } from "./diffs";
import { getPostId } from "./getters";
import { testGraph } from "./graphs";
import { moveProgressToTabs } from "./progress";
import { addStatsSidebar } from "./stats";
import { optimizePageTitle } from "./title";

testGraph(); //TODO: remove
/* type ReputationInfo = {
  on_date: number;
  post_id: number;
  post_type: "answer" | "question";
  reputation_change: number;
  user_id: number;
  vote_type: "up_votes";
}; */

(async () => {
    const postId = getPostId(config);

    if (!postId) return;

    const handlerMap: {
        [x: string]: (
            cnf: typeof config,
            postId: string
        ) => boolean | Promise<boolean>;
    } = {
        moveProgressToTabs,
        optimizePageTitle,
        decolorDiff,
        addAuditNotification,
    };

    const promises = Object.entries(handlerMap).map(([key, handler]) => [
        key,
        handler(config, postId),
    ]);

    const statuses = await Promise.all(promises);

    const statusMsg = statuses.reduce(
        (acc, [k, v]) => `${acc}\n${k} - ${v ? "ok" : "failed"}`,
        "Status: "
    );

    console.debug(statusMsg);

    await addStatsSidebar(config);
})();

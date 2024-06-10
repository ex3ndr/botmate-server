import { runInLock } from "../lock/runInLock";
import { Tx, afterTx, inTx } from "../storage/inTx";
import { completeTask, popTask } from "./tasks";
import { delay } from "../../utils/time";
import { Tasks } from "../../agent/tasks";

export function startTaskWorker<T extends keyof Tasks>(name: string, kind: T, handler: (task: Tasks[T], commit: (tx: Tx) => Promise<void>) => Promise<void>) {
    runInLock('task-worker-' + name, async () => {

        // Pick a task
        const work = await inTx((tx) => popTask(tx, kind));
        if (!work) {
            await delay(1000);
            return;
        }

        // Run worker
        let commited = false;
        let commiter = async (tx: Tx) => {
            await completeTask(tx, work.id);
            afterTx(tx, () => { commited = true; });
        };

        // Process task
        await handler(work.data, commiter);

        // Ensure commit
        if (!commited) {
            await inTx(commiter);
        }
    });
}
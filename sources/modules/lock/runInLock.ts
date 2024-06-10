import { isShutdown } from "../../utils/shutdown";
import { backoff } from "../../utils/time";
import { releaseLock, tryLock } from "./tryLock";
import { delay } from "teslabot";
import * as uuid from 'uuid';

export function runInLock(lockKey: string, worker: (refresh: () => Promise<boolean>) => Promise<void>, options?: { lockDelay?: number, lockTimeout?: number }) {
    const key = uuid.v4();
    backoff(async () => {

        // Do work
        while (!isShutdown()) {
            let locked = await tryLock(lockKey, key, options?.lockTimeout || 15000);
            if (!locked) {
                await delay(options?.lockDelay || 5000);
                continue;
            }
            await worker(async () => {
                return await tryLock(lockKey, key, options?.lockTimeout || 15000);
            });
        }

        // Release lock
        await releaseLock(lockKey, key);
    });
}
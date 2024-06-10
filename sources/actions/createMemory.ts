import { feedPost } from "../modules/feed/actions";
import { SystemUsers, systemUser } from "../modules/profile/systemUsers";
import { Tx } from "../modules/storage/inTx";
import { Memory } from "../modules/feed/memories";
import { pushUpdate } from "../modules/updates/updates";
import { sendPushNotification } from "./sendPushNotification";

export async function createMemory(tx: Tx, uid: string, by: SystemUsers, memory: Memory) {

    // Pick memory id
    let maxIndex = await tx.memory.aggregate({
        where: {
            userId: uid
        },
        _max: {
            index: true
        }
    });
    let nextId = 0;
    if (maxIndex._max.index !== null) {
        nextId = maxIndex._max.index + 1;
    }

    // Create memory
    const memoryEntity = await tx.memory.create({
        data: {
            userId: uid,
            index: nextId,
            data: memory
        }
    });

    // Push update
    await pushUpdate(tx, uid, { type: 'memory-created', id: memoryEntity.id, index: nextId, memory: memory });

    // Write moment to default feed
    await feedPost(tx, {
        feed: { type: 'default' },
        uid: uid,
        by: systemUser(by),
        content: {
            kind: 'memory',
            id: memoryEntity.id
        }
    });

    // Write moment to smart feed
    await feedPost(tx, {
        feed: { type: 'smart' },
        uid: uid,
        by: systemUser(by),
        content: {
            kind: 'memory',
            id: memoryEntity.id
        }
    });

    // Push notification
    // if (await isExperimental(tx, uid)) {
    await sendPushNotification(tx, {
        uid,
        title: '✨ New memory',
        body: memory.title
    });
    // }
}
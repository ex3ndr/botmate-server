import type { Tasks } from "../../agent/tasks";
import { Tx } from "../storage/inTx";

export async function pushTask<T extends keyof Tasks>(tx: Tx, type: T, data: Tasks[T]) {

    // Pick task id
    let maxIndex = await tx.task.aggregate({
        where: {
            queue: type
        },
        _max: {
            index: true
        }
    });
    let nextId = 0;
    if (maxIndex._max.index !== null) {
        nextId = maxIndex._max.index + 1;
    }

    // Create task
    await tx.task.create({
        data: {
            index: nextId,
            queue: type,
            data
        }
    });
}

export async function popTask<T extends keyof Tasks>(tx: Tx, type: T) {
    let task = await tx.task.findFirst({
        where: {
            queue: type
        },
        orderBy: {
            index: 'asc'
        }
    });
    if (task) {
        return { id: task.id, data: task.data as Tasks[T] };
    }
    return null;
}

export async function completeTask(tx: Tx, id: string) {
    await tx.task.findUniqueOrThrow({ where: { id } }); // Ensure task exists
    await tx.task.delete({ where: { id } });
}
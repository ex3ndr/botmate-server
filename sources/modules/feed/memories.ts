import { Tx, inTx } from "../storage/inTx";
import { s3bucket } from "../storage/files";

export type Memory = {
    title: string;
    summary: string;
    image: {
        url: string;
        thumbhash: string;
        width: number;
        height: number;
    } | null
};

export async function getMemories(uid: string) {
    return await inTx(async (tx) => {
        let memories = await tx.memory.findMany({
            where: {
                userId: uid
            },
            orderBy: {
                index: 'desc'
            }
        });
        return memories.map((m) => ({
            id: m.id,
            index: m.index,
            createdAt: m.createdAt.getTime(),
            ...(m.data as any),
            image: (m.data as any).image ? 'https://' + process.env.S3_HOST + '/' + s3bucket + '/' + (m.data as any).image : null
        }));
    });
}

export async function getMemory(tx: Tx, uid: string, id: string) {
    let memory = await tx.memory.findFirstOrThrow({
        where: {
            id,
            userId: uid
        }
    });
    return {
        id: memory.id,
        index: memory.index,
        createdAt: memory.createdAt.getTime(),
        ...(memory.data as any),
        image: (memory.data as any).image ? 'https://' + process.env.S3_HOST + '/' + s3bucket + '/' + (memory.data as any).image : null
    };
}
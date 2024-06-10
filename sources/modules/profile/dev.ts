import { randomKey } from "../../utils/randomKey";
import { Tx } from "../storage/inTx";

export async function updateDevMode(tx: Tx, uid: string, devmode: boolean) {
    await tx.user.update({
        where: { id: uid },
        data: { developer: devmode }
    });
}

export async function createApiToken(tx: Tx, uid: string) {
    let token = await tx.personalTokens.create({
        data: {
            userId: uid,
            token: randomKey('gpk', 48)
        }
    });
    return { id: token.id, token: token.token };
}

export async function deleteApiToken(tx: Tx, uid: string, id: string) {
    await tx.personalTokens.delete({
        where: { id, userId: uid }
    });
}

export async function listApiTokens(tx: Tx, uid: string) {
    let tokens = await tx.personalTokens.findMany({
        where: { userId: uid }
    });
    return tokens.map(t => ({ id: t.id, created: t.createdAt.getTime(), used: t.usedAt ? t.usedAt.getTime() : null }));
}

export async function isDeveloper(tx: Tx, uid: string) {
    let user = await tx.user.findFirst({ where: { id: uid } });
    if (!user || user.deletedAt !== null) {
        return false;
    }
    return user.developer;
}

export async function isExperimental(tx: Tx, uid: string) {
    let user = await tx.user.findFirst({ where: { id: uid } });
    if (!user || user.deletedAt !== null) {
        return false;
    }
    return user.experimental;
}
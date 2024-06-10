import { inTx } from "../storage/inTx";

export async function getAccountStatus(uid: string): Promise<boolean> {
    return await inTx(async (tx) => {
        let user = await tx.user.findUniqueOrThrow({ where: { id: uid } });
        if (!!user.deletedAt) {
            return false;
        } else {
            return true;
        }
    });
}
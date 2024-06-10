import { inTx } from "../storage/inTx";

export async function registerPushToken(uid: string, token: string) {
    await inTx(async (tx) => {

        // Check existing
        let existing = await tx.pushTokens.findFirst({ where: { token: token } });
        if (existing && existing.userId === uid) {
            return;
        }

        // Delete existing
        if (existing && existing.userId !== uid) {
            await tx.pushTokens.delete({ where: { id: existing.id } });
        }

        // Create new
        await tx.pushTokens.create({
            data: {
                token: token,
                userId: uid
            }
        });
    });
}
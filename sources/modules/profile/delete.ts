import { inTx } from "../storage/inTx";

export async function deleteProfile(uid: string) {
    await inTx<void>(async (tx) => {

        // Check if user exists
        let existing = await tx.user.findUnique({ where: { id: uid } });
        if (!existing || !!existing.deletedAt) {
            return;
        }

        // Mark user as deleted
        await tx.user.update({ where: { id: uid }, data: { deletedAt: new Date() } });
    });
}
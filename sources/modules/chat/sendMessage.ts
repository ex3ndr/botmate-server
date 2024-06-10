import { feedPost } from "../feed/actions";
import { Content } from "../feed/types";
import { Tx } from "../storage/inTx";

export async function sendMessage(tx: Tx, args: { by: string, to: string, content: Content }) {
    // await feedPost(tx, {
    //     type: 'default',
    //     by,
    //     to,
    //     content
    // });
}
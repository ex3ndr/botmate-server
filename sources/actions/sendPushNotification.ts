import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Tx, afterTx } from "../modules/storage/inTx";

const expo = new Expo();

export async function sendPushNotification(tx: Tx, args: { uid: string, title: string, body: string }) {
    // Load tokens
    let pushTokens = await tx.pushTokens.findMany({ where: { userId: args.uid } });
    let tokens = pushTokens.map((v) => v.token);
    tokens = tokens.filter((v) => Expo.isExpoPushToken(v));

    // Push tokens
    if (tokens.length > 0) {

        // Prepare messages
        let messages: ExpoPushMessage[] = tokens.map((token) => ({
            to: token,
            title: args.title,
            body: args.body
        }));
        let chunks = expo.chunkPushNotifications(messages);

        // Send messages
        afterTx(tx, () => {
            (async () => {
                for (let chunk of chunks) {
                    try {
                        await expo.sendPushNotificationsAsync(chunk);
                    } catch (error) {
                        console.error(error);
                    }
                }
            })();
        });
    }
}
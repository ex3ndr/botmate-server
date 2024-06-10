import Redis from 'ioredis';
import { eventBus } from './eventbus';
import { randomKey } from '../../utils/randomKey';

let clients: { subscriber: Redis, publisher: Redis } | null = null;

export async function initRedis() {
    if (process.env.REDIS_URL) {

        // Create client
        const nodeId = randomKey('nid');
        const subscriber = new Redis(process.env.REDIS_URL);
        const publisher = new Redis(process.env.REDIS_URL);

        // Connect
        await subscriber.connect();
        await publisher.connect();
        await subscriber.subscribe('pubsub-updates');

        // Forward
        eventBus.all((name, ...args) => {
            publisher.publish('pubsub-updates', JSON.stringify({ nodeId, name, args }));
        });

        // Receive
        subscriber.on('message', (channel, message) => {
            if (channel === 'pubsub-updates') {
                let data = JSON.parse(message);
                if (data.nodeId !== nodeId) {
                    eventBus.emit(data.name, ...data.args);
                }
            }
        });

        // Save
        clients = { subscriber, publisher };
    }
}
import { FastifyInstance } from "fastify";
import { eventBus } from "../../eventbus/eventbus";
import { authUser } from "./auth";
import { getLastSeq } from "../../updates/seq";
import { inTx } from "../../storage/inTx";
import { getUpdates } from "../../updates/updates";
import * as z from "zod";
import { backoff, delay } from "../../../utils/time";

export async function updates(app: FastifyInstance) {
    app.get("/updates", async (request, reply) => {
        let uid = authUser(request);
        let disconnected = false;

        // Header
        reply.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        reply.raw.setHeader("Connection", "keep-alive");
        reply.raw.setHeader("Cache-Control", "no-cache,no-transform");
        reply.raw.setHeader("x-no-compression", 1);
        reply.raw.setHeader('Access-Control-Allow-Origin', '*');
        reply.raw.write(`retry: ${Math.round(3000 + Math.random() * 2000)}\n\n`); // Retry every 3-5 seconds

        // Send data
        const handler = (seq: number, data: any) => {
            reply.raw.write(`data: ${JSON.stringify({ seq, data })}\n\n`);
        }
        eventBus.on(`update:${uid}`, handler);

        // Push last known seq

        backoff(async () => {
            while (!disconnected) {

                // Send last seq
                let seq = await inTx((tx) => getLastSeq(tx, uid));
                reply.raw.write(`data: ${JSON.stringify({ seq })}\n\n`);

                // Wait
                await delay(10000);
            }
        });

        // Send pings
        const ping = setInterval(() => {
            reply.raw.write(": ping\n\n");
        }, 30000);

        // Subscribe to close
        reply.raw.on("close", () => {
            disconnected = true;
            eventBus.off(`update:${uid}`, handler);
            clearInterval(ping);
        });
    });
    app.post('/updates/seq', async (request, reply) => {
        let uid = authUser(request);
        let seq = await inTx((tx) => getLastSeq(tx, uid));
        return { ok: true, seq: seq };
    });
    const diffRequest = z.object({
        after: z.number()
    }).strict();
    app.post('/updates/diff', async (request, reply) => {
        const body = diffRequest.safeParse(request.body);
        if (!body.success) {
            reply.code(400);
            return { ok: false, error: 'invalid_request' };
        }
        let uid = authUser(request);

        // Load updates
        let updates = await inTx((tx) => getUpdates(tx, uid, body.data.after));

        // Results
        return {
            ok: true,
            updates: updates.updates.map((v) => v.data),
            seq: updates.updates.length > 0 ? updates.updates[updates.updates.length - 1].seq : body.data.after,
            hasMore: updates.hasMore
        }
    });
}
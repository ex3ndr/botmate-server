import { FastifyInstance } from "fastify";
import * as z from 'zod';
import { authUser } from "./auth";
import { inTx } from "../../storage/inTx";
import { getFeedSeqno, feedList } from "../../feed/actions";
import { feedItemToAPI } from "../convert";
import { getFeedSourceFromPublicID, getFeedTag } from "../../feed/sources";
import { FeedSource } from "../../feed/types";

export async function feed(app: FastifyInstance) {

    // Get Feed State
    const feedGet = z.object({
        source: z.string().optional().nullable(),
    }).strict();
    app.post('/feed/state', async (request, reply) => {
        const body = feedGet.safeParse(request.body);
        if (!body.success) {
            reply.code(400);
            return { ok: false, error: 'invalid_request' };
        }
        let source: FeedSource = body.data.source ? getFeedSourceFromPublicID(body.data.source) : { type: 'default' };
        let uid = authUser(request);
        let seqno = await inTx(async (tx) => {
            return await getFeedSeqno(tx, uid, source);
        });
        return {
            ok: true,
            seqno
        };
    });

    // Get Feed Items
    const feedListReq = z.object({
        source: z.string().optional().nullable(),
        after: z.number().optional().nullable(),
        before: z.number().optional().nullable(),
    }).strict();
    app.post('/feed/list', async (request, reply) => {
        const body = feedListReq.safeParse(request.body);
        if (!body.success) {
            reply.code(400);
            return { ok: false, error: 'invalid_request' };
        }
        let uid = authUser(request);
        let source: FeedSource = body.data.source ? getFeedSourceFromPublicID(body.data.source) : { type: 'default' };
        let res = await feedList(uid, source, body.data.before ? body.data.before : null, body.data.after ? body.data.after : null);
        return {
            ok: true,
            items: res.items.map((v) => feedItemToAPI(v)),
            next: res.next
        };
    });
}
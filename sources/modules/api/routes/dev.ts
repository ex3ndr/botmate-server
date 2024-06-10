import { FastifyInstance } from "fastify";
import * as z from 'zod';
import { inTx } from "../../storage/inTx";
import { authUser } from "./auth";
import { createApiToken, deleteApiToken, listApiTokens } from "../../profile/dev";

export async function dev(app: FastifyInstance) {
    app.post('/dev/tokens', async (request, reply) => {
        const uid = authUser(request);
        const tokens = await inTx(async (tx) => {
            return await listApiTokens(tx, uid)
        });
        return {
            ok: true,
            tokens
        };
    });
    app.post('/dev/tokens/create', async (request, reply) => {
        const uid = authUser(request);
        const token = await inTx(async (tx) => {
            return await createApiToken(tx, uid)
        });
        return {
            ok: true,
            token
        };
    });
    const tokenDelete = z.object({
        id: z.string(),
    }).strict();
    app.post('/dev/tokens/delete', async (request, reply) => {
        const body = tokenDelete.safeParse(request.body);
        if (!body.success) {
            reply.code(400);
            return { ok: false, error: 'invalid_request' };
        }
        const uid = authUser(request);
        await inTx(async (tx) => {
            await deleteApiToken(tx, uid, body.data.id)
        });
        return {
            ok: true
        };
    });
}
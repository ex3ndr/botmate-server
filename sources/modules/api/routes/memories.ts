import { FastifyInstance } from "fastify";
import * as z from 'zod';
import { authUser } from "./auth";
import { getMemory } from "../../feed/memories";
import { inTx } from "../../storage/inTx";

export async function memories(app: FastifyInstance) {
    // Get Memory
    const memoriesGet = z.object({
        ids: z.array(z.string()),
    }).strict();
    app.post('/memories', async (request, reply) => {
        const body = memoriesGet.safeParse(request.body);
        if (!body.success) {
            reply.code(400);
            return { ok: false, error: 'invalid_request' };
        }
        let uid = authUser(request);

        // Load the profiles
        let memories = await inTx(async (tx) => {
            return await Promise.all(body.data.ids.map(async (id) => {
                return await getMemory(tx, uid, id);
            }));
        });

        return {
            ok: true,
            memories
        };
    });

}
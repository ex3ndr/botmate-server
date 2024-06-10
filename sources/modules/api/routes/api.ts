import { FastifyInstance } from "fastify";
import { authUser } from "./auth";

export async function api(app: FastifyInstance) {
    app.get('/health', async (request, reply) => {
        let uid = authUser(request);
        return { ok: true, uid };
    });
}
import { FastifyInstance } from "fastify";
import { authRaw } from "./auth";
import { deleteProfile } from "../../profile/delete";

export async function secure(app: FastifyInstance) {
    app.post('/delete', async (request, reply) => {
        let auth = authRaw(request);

        // Delete profile
        if (auth !== null && !auth.deleted) {
            await deleteProfile(auth.id);
        }

        // Done
        return {
            ok: true
        };
    });
    app.post('/status', async (request, reply) => {
        let auth = authRaw(request);
        let status = false;
        if (auth) { // auth === null when token is invalid
            if (auth.deleted) {
                status = false;
            } else {
                status = true;
            }
        }
        return {
            ok: status,
        };
    });
}
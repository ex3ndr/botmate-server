import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import * as z from "zod";
import { completeAuth, resolveApiToken, resolveToken, startAuth } from "../../auth/operations";

//
// Authentication routes
//

export async function auth(app: FastifyInstance) {
    const authStartSchema = z.object({
        key: z.string(),
        login: z.string(),
    }).strict();
    app.post('/start', async (request, reply) => {
        const body = authStartSchema.safeParse(request.body);
        if (!body.success) {
            reply.code(400);
            return { ok: false, error: 'invalid_request' };
        }
        return await startAuth(body.data.login, body.data.key);
    });

    const authVerifySchema = z.object({
        login: z.string(),
        code: z.string(),
        key: z.string(),
    }).strict();
    app.post('/verify', async (request, reply) => {
        const body = authVerifySchema.safeParse(request.body);
        if (!body.success) {
            reply.code(400);
            return { ok: false, error: 'invalid_request' };
        }
        return await completeAuth(body.data.login, body.data.key, body.data.code);
    });
}

//
// Token authentication
//

export function tokenAuthPlugin(mode: 'login' | 'user' | 'any' | 'api') {
    return async function (request: FastifyRequest, reply: FastifyReply) {

        // Check for token
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            if (mode !== 'any') {
                reply.status(401).send({ error: 'Unauthorized' });
            }
            (request as any).setAuthNone();
            return;
        }

        if (mode !== 'api') {

            // Load token
            const token = authHeader.split(' ')[1];
            let resolved = await resolveToken(token);
            if (!resolved) {
                if (mode !== 'any') {
                    reply.status(401).send({ error: 'Invalid token' });
                }
                (request as any).setAuthNone();
                return;
            }
            if (mode === 'user' && (!resolved.user || resolved.deleted)) {
                reply.status(401).send({ error: 'User not found' });
                return;
            }

            // Store auth data
            (request as any).setAuth(resolved.login, resolved.id, resolved.user ? resolved.user : null, resolved.deleted ? resolved.deleted : false);
        } else {
            const token = authHeader.split(' ')[1];
            const user = await resolveApiToken(token);
            if (!user) {
                reply.status(401).send({ error: 'Invalid token' });
                return;
            }

            // Store auth data
            (request as any).setAuth(user.login, null, user.id, false);
        }
    };
}

//
// Authentication context helpers
//

export function authUser(request: FastifyRequest) {
    if (!(request as any).auth.user || (request as any).auth.deleted) {
        throw new Error('No user in request');
    }
    return (request as any).auth.user as string;
}

export function authUserAllowDeleted(request: FastifyRequest) {
    if (!(request as any).auth.user) {
        throw new Error('No user in request');
    }
    return (request as any).auth.user as string;
}

export function authLogin(request: FastifyRequest) {
    return (request as any).auth.login as string;
}

export function authID(request: FastifyRequest) {
    return (request as any).auth.id as string;
}

export function authRaw(request: FastifyRequest) {
    return (request as any).auth as { email: string, id: string, user: string | null, deleted: boolean | null } | null;
}
import fastify from "fastify";
import bearerAuthPlugin from "@fastify/bearer-auth";
import { log } from "../../utils/log";
import { auth, tokenAuthPlugin } from "./routes/auth";
import { pre } from "./routes/pre";
import { updates } from "./routes/updates";
import { services } from "./routes/services";
import { memories } from "./routes/memories";
import { secure } from "./routes/secure";
import { profile } from "./routes/profile";
import { hasRole } from "../../roles";
import { feed } from "./routes/feed";
import { superOps } from "./routes/super";
import { api } from "./routes/api";
import { dev } from "./routes/dev";

export async function startApi() {

    // Configure
    log('Starting API...');

    // Start API
    const app = fastify({
        logger: hasRole('api'),
        trustProxy: true,
        bodyLimit: 1024 * 1024 * 100, // 100MB
    });
    app.register(require('@fastify/cors'), {
        origin: '*',
        allowedHeaders: '*',
        methods: ['GET', 'POST']
    });
    app.decorateRequest('setAuth', function (login: string, id: string, user: string | null, deleted: boolean | null) {
        (this as any).auth = { login, user, id, deleted };
    });
    app.decorateRequest('setAuthNone', function () {
        (this as any).auth = null;
    });
    app.get('/', function (request, reply) {
        reply.send('Welcome to Botmate API!');
    });

    if (hasRole('api')) {
        // Auth routes
        app.register(auth, { prefix: '/auth' });

        // Onboarding routes
        app.register(async (sub) => {
            sub.addHook('preHandler', tokenAuthPlugin('login')); // Requires login associated with token
            pre(sub);
        }, { prefix: '/pre' });

        // Authenticated routes
        app.register(async function (sub) {
            sub.addHook('preHandler', tokenAuthPlugin('user')); // Requires non-deleted user associated with token
            updates(sub);
            services(sub);
            memories(sub);
            profile(sub);
            feed(sub);
            dev(sub);
        }, { prefix: '/app' });

        // Special case for account operations that don't require a valid user
        app.register(async function (sub) {
            sub.addHook('preHandler', tokenAuthPlugin('any')); // Doesn't require any user, login or token
            secure(sub);
        }, { prefix: '/secure' });

        // Super ops
        app.register(async function (sub) {
            sub.register(bearerAuthPlugin, { keys: process.env.SUPER_TOKENS!.split(',') });
            superOps(sub);
        }, { prefix: '/super' });
    }

    // Public API
    if (hasRole('public-api')) {
        app.register(async function (sub) {
            sub.addHook('preHandler', tokenAuthPlugin('api')); // Requires non-deleted user associated with personal token
            api(sub);
        }, { prefix: '/v1' });
    }

    // Start
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    await app.listen({ port, host: '0.0.0.0' });

    // End
    log('API ready on port http://localhost:' + port);
}
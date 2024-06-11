import { AsyncLock } from "teslabot";
import { twilio } from "./twilio";
import { inTx } from "../storage/inTx";
import { generateSafeToken } from "../crypto/generateSafeToken";
import { User } from "@prisma/client";
import { normalizeLogin, validateLogin } from "./login";
import { getUserByLogin } from "../profile/user";
import { isTestNumber } from "./isTestNumber";

const lock = new AsyncLock();
export type AuthStartResponse = { ok: true, login: string } | { ok: false, error: 'invalid_login' | 'too_many_attempts' };
export async function startAuth(login: string, key: string): Promise<AuthStartResponse> {
    return await lock.inLock(async () => {

        // Normalized
        const normalizedLogin = await normalizeLogin(login);
        if (!normalizedLogin) {
            return { ok: false, error: 'invalid_login' };
        }

        // Verify
        if (!await validateLogin(normalizedLogin)) {
            return { ok: false, error: 'invalid_login' };
        }

        // Check if test number
        if (normalizedLogin.type === 'phone' && isTestNumber(normalizedLogin.normalized)) {
            return { ok: true, login: normalizedLogin.normalized };
        }

        // Request verification code
        const output = await twilio.verify.v2.services(process.env.TWILIO_SERVICE_VERIFY!)
            .verifications
            .create({ to: normalizedLogin.normalized, channel: normalizedLogin.type });
        if (output.status !== 'pending') {
            return { ok: false, error: 'too_many_attempts' };
        }

        return { ok: true, login: normalizedLogin.normalized };
    });
}

export type AuthCompleteResponse = { ok: true, token: string } | { ok: false, error: 'invalid_login' | 'invalid_code' | 'expired_code' };
export async function completeAuth(login: string, key: string, code: string): Promise<AuthCompleteResponse> {
    return await lock.inLock(async () => {

        // Normalized
        const normalizedLogin = await normalizeLogin(login);
        if (!normalizedLogin) {
            return { ok: false, error: 'invalid_login' };
        }

        // Verify
        if (normalizedLogin.type === 'phone' && isTestNumber(normalizedLogin.normalized)) {
            if (code !== normalizedLogin.normalized.slice(normalizedLogin.normalized.length - 6)) {
                return { ok: false, error: 'invalid_code' };
            }
        } else {
            const output = await twilio.verify.v2.services(process.env.TWILIO_SERVICE_VERIFY!)
                .verificationChecks
                .create({ to: normalizedLogin.normalized, code: code });
            if (output.status === 'pending') {
                return { ok: false, error: 'invalid_code' };
            }
            if (output.status === 'canceled') {
                return { ok: false, error: 'expired_code' };
            }
        }

        // Generate token
        const token = await generateSafeToken();

        // Persist token
        await inTx(async (tx) => {

            // Check if token exists
            let ex = await tx.sessionToken.findUnique({ where: { key: token } });
            if (ex) {
                return;
            }

            // Try to find user
            let user = await getUserByLogin(tx, normalizedLogin.key);

            // Create token
            await tx.sessionToken.create({ data: { key: token, login: normalizedLogin.key, userId: user ? user.id : null } });
        });

        // Return result
        return { ok: true, token };
    });
}

export type ResolveTokenResult = { user?: string, deleted?: boolean, id: string, login: string } | null;
export async function resolveToken(token: string): Promise<ResolveTokenResult> {
    return await inTx(async (tx) => {
        let session = await tx.sessionToken.findUnique({ where: { key: token } });
        if (!session) {
            return null;
        }
        if (session.userId) {
            let user = await tx.user.findUnique({ where: { id: session.userId } });
            let deleted = !user || user.deletedAt !== null;
            return { login: session.login, id: session.id, user: session.userId, deleted };
        } else {
            return { login: session.login, id: session.id, };
        }
    });
}

export async function resolveApiToken(token: string): Promise<User | null> {
    return await inTx(async (tx) => {

        // Fetch token
        let personalToken = await tx.personalTokens.findUnique({ where: { token } });
        if (!personalToken) {
            return null;
        }

        // Fetch user
        let user = await tx.user.findUnique({ where: { id: personalToken.userId } });
        if (!user || user.deletedAt !== null) {
            return null;
        }

        // Update usedAt
        await tx.personalTokens.update({
            where: { id: personalToken.id },
            data: { usedAt: new Date() }
        });

        return user;
    });
}
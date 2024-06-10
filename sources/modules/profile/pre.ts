import { inTx } from "../storage/inTx";
import { checkUsername } from "./checkUsername";
import { getUserByLogin, getUserByUsername } from "./user";

export type PreStateResponse = {
    login: string,
    needName: boolean,
    needUsername: boolean,
    active: boolean,
    canActivate: boolean,
}
export async function resolvePreState(login: string): Promise<PreStateResponse> {
    return await inTx<PreStateResponse>(async (tx) => {
        let needName = true;
        let needUsername = true;
        let canActivate = false;
        let active = false;

        // Check if profile exists
        let user = await getUserByLogin(tx, login);
        if (user) {
            needName = false;
            needUsername = false;
            active = true;
        } else {
            let onboardingState = await tx.onboardingState.findUnique({ where: { login } });
            if (onboardingState) {
                if (onboardingState.firstName !== null) {
                    needName = false;
                }
                if (onboardingState.username !== null) {
                    needUsername = false;
                }
            }
        }

        // If profile completed and username is set, then canActivate
        canActivate = !needName && !needUsername && !active;

        // Return result
        return { login, needName, needUsername, active, canActivate };
    });
}

export async function saveUsername(login: string, username: string): Promise<'ok' | 'invalid_username' | 'already_used'> {
    return await inTx<'ok' | 'invalid_username' | 'already_used'>(async (tx) => {

        // Ignore if user (with username) already exists
        let user = await getUserByLogin(tx, login);
        if (user) {
            return 'ok';
        }

        // Ignore if onboarding state already exists and has username
        let onboardingState = await tx.onboardingState.findUnique({ where: { login } });
        if (onboardingState && onboardingState.username !== null) {
            return 'ok';
        }

        // Check username format
        if (!checkUsername(username)) {
            return 'invalid_username';
        }

        // Check if username is already used by user
        let usernameExists = await getUserByUsername(tx, username);
        if (usernameExists) {
            return 'already_used';
        }

        // Check if username is already used by onboarding state
        onboardingState = await tx.onboardingState.findFirst({
            where: {
                username: {
                    equals: username,
                    mode: 'insensitive'
                }
            }
        });
        if (onboardingState) {
            return 'already_used';
        }

        // Save username
        await tx.onboardingState.upsert({
            where: { login },
            create: { login, username },
            update: { username }
        });

        return 'ok';
    });
}

export async function saveName(login: string, firstName: string, lastName: string | null): Promise<'ok' | 'invalid_name'> {
    return await inTx<'ok' | 'invalid_name'>(async (tx) => {

        // Ignore if user already exists
        let user = await getUserByLogin(tx, login);
        if (user) {
            return 'ok';
        }

        // Check name format
        if (firstName.length === 0 || firstName.length > 50) {
            return 'invalid_name';
        }
        if (lastName !== null && (lastName.length === 0 || lastName.length > 50)) {
            return 'invalid_name';
        }

        // Save name
        await tx.onboardingState.upsert({
            where: { login },
            create: { login, firstName, lastName },
            update: { firstName, lastName }
        });

        return 'ok';
    });
}

export async function completeProfile(login: string): Promise<'ok' | 'invalid_state'> {
    return await inTx<'ok' | 'invalid_state'>(async (tx) => {

        // Ignore if user already exists
        let user = await getUserByLogin(tx, login);
        if (user) {
            return 'ok';
        }

        // Load onboarding state
        let onboardingState = await tx.onboardingState.findUnique({ where: { login } });
        if (!onboardingState) {
            return 'invalid_state';
        }

        // Check if all fields are filled
        if (onboardingState.firstName === null || onboardingState.username === null) {
            return 'invalid_state';
        }

        // Create user
        const u = await tx.user.create({
            data: {
                login,
                username: onboardingState.username,
                firstName: onboardingState.firstName,
                lastName: onboardingState.lastName,
                deletedAt: null
            }
        });

        // Update tokens
        await tx.sessionToken.updateMany({
            where: { login },
            data: { userId: u.id }
        });

        // Delete onboarding state
        await tx.onboardingState.delete({ where: { login } });

        return 'ok';
    });
}
import { inTx } from "../storage/inTx";

//
// Profiles
//

type SystemProfile = {
    firstName: string;
    lastName: string | null;
}

const systemUsers = {
    'super': {
        firstName: 'Super Agent',
        lastName: null
    }
} as const;

export type SystemUsers = keyof typeof systemUsers;

//
// Operations
//

const loaded = new Map<string, string>();

export async function loadSystemUsers() {
    await inTx(async (tx) => {
        for (let s of Object.keys(systemUsers)) {

            // Loading the system user
            let profile: SystemProfile = (systemUsers as any)[s];
            let su = await tx.systemUser.findFirst({ where: { tag: s } });
            if (!su) {
                // Create the user
                const u = await tx.user.create({
                    data: {
                        login: 'system:' + s,
                        username: s,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        bot: true,
                        system: true,
                        deletedAt: null
                    }
                });

                // Persist the system user
                await tx.systemUser.create({
                    data: {
                        tag: s,
                        userId: u.id
                    }
                });

                // Save
                loaded.set(s, u.id);
            } else {

                // Load user
                let u = await tx.user.findFirstOrThrow({ where: { id: su.userId } });

                // Check if profile changed
                if (u.firstName !== profile.firstName || u.lastName !== profile.lastName) {
                    await tx.user.update({
                        where: { id: su.userId },
                        data: {
                            firstName: profile.firstName,
                            lastName: profile.lastName
                        }
                    });
                }

                // Save
                loaded.set(s, su.userId);
            }
        }
    });
}

export function systemUser(s: SystemUsers) {
    return loaded.get(s)!;
}
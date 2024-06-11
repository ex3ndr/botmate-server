import { User } from "@prisma/client";
import { Tx } from "../storage/inTx";

export async function getUserByLogin(tx: Tx, login: string): Promise<User | null> {
    return await tx.user.findFirst({
        where: { login, deletedAt: null }
    });
}

export async function getUserByUsername(tx: Tx, username: string): Promise<User | null> {
    return await tx.user.findFirst({
        where: { username: { equals: username, mode: 'insensitive' }, deletedAt: null }
    });
}

export async function getUserProfilePublic(tx: Tx, uid: string, visibleBy: string) {
    let user = await tx.user.findFirst({
        where: { id: uid, deletedAt: null }
    });
    let username: string = 'deleted';
    let firstName: string | null = 'Deleted';
    let lastName: string | null = 'Account';
    let bot = false;
    let system = false;
    if (user) {
        firstName = user.firstName;
        lastName = user.lastName;
        username = user.username;
        bot = user.bot;
        system = user.system;
    }
    return {
        id: uid,
        firstName,
        lastName,
        username,
        exist: !!user,
        bot,
        system,
    };
}

export async function getUserProfilePrivate(tx: Tx, uid: string) {
    let user = await tx.user.findFirst({
        where: { id: uid, deletedAt: null }
    });
    let username: string = 'deleted';
    let firstName: string = 'Deleted';
    let lastName: string | null = 'Account';
    let roles: string[] = [];
    let email: string | null = null;
    let phone: string | null = null;
    if (user) {
        username = user.username;
        firstName = user.firstName;
        lastName = user.lastName;
        if (user.login.startsWith('phone:')) {
            phone = user.login.slice(6);
        } else if (user.login.startsWith('email:')) {
            email = user.login.slice(6);
        }
        if (user.experimental) {
            roles.push('experimental');
        }
        if (user.developer) {
            roles.push('developer');
        }
    }
    return {
        id: uid,
        username,
        email,
        phone,
        firstName,
        lastName,
        roles
    };
}
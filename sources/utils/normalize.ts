import parsePhoneNumber from 'libphonenumber-js';

export function normalizePhone(number: string) {
    let parsed = parsePhoneNumber(number);
    if (!parsed) {
        return null;
    } else {
        return parsed.number as string;
    }
}

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
    return username.trim().toLowerCase();
}
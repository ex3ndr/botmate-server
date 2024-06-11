import { isValidPhoneNumber } from "libphonenumber-js";
import { normalizeEmail, normalizePhone } from "../../utils/normalize";
import { validateNumber } from "./twilio";
import { isTestNumber } from "./isTestNumber";

export async function normalizeLogin(login: string) {
    // Trim inputs
    login = login.trim();

    // Try parsing as phone
    let n = normalizePhone(login);
    if (n) {
        return { key: 'phone:' + n, normalized: n, type: 'phone' as const };
    } else {
        let e = normalizeEmail(login);
        if (!e) {
            return null;
        }
        return {
            key: 'email:' + e,
            normalized: e,
            type: 'email' as const
        }
    }

}

export async function validateLogin(login: { normalized: string, type: 'email' | 'phone' }) {
    if (login.type === 'phone') {
        if (isTestNumber(login.normalized)) {
            return true;
        }
        return await validateNumber(login.normalized);
    } else if (login.type === 'email') {
        let parts = login.normalized.split('@');
        if (parts.length !== 2) {
            return false;
        }
        if (parts[0].length === 0 || parts[1].length === 0) {
            return false;
        }
        if (parts[0].length > 64 || parts[1].length > 255) {
            return false;
        }
        if (parts[0].startsWith('.') || parts[0].endsWith('.') || parts[1].startsWith('.') || parts[1].endsWith('.')) {
            return false;
        }
        return true; // TODO email validation   
    } else {
        return false;
    }
}
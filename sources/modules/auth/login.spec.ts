import { normalizeLogin } from "./login";

describe('login', () => {
    it('should normalize number', async () => {
        let res = await normalizeLogin('+1 (555) 555-5555');
        expect(res).toBeDefined();
        expect(res!.type).toEqual('phone');
        expect(res!.normalized).toEqual('+15555555555');
    });
    it('should normalize email', async () => {
        let res = await normalizeLogin('steVe@korshakov.com   ');
        expect(res).toBeDefined();
        expect(res!.type).toEqual('email');
        expect(res!.normalized).toEqual('steve@korshakov.com');
    });
});
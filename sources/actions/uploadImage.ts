import { s3bucket, s3client } from "../modules/storage/files";

export async function uploadImage(to: string, data: Buffer) {
    await s3client.putObject(s3bucket, to, data);
}